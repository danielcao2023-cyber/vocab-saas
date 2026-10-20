<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { api, ClientError, OfflineError, speak, stopAudio, type PlaybackFailure } from '../api';
import { PendingSubmitter } from '../pending';
import { COPY, isRepeatCard } from '../copy';
import type { Turn, ChoiceResult } from '../types';
import { charDiff, isNearMiss } from '../diff';
import MeaningList from '../MeaningList.vue';
import RecognizeCard from '../components/RecognizeCard.vue';
import ChoiceQuestion from '../components/ChoiceQuestion.vue';
import ExplainPanel from '../components/ExplainPanel.vue';
import SpeakButton from '../components/SpeakButton.vue';
import AnswerLesson from '../components/AnswerLesson.vue';
const props=defineProps<{ prefer: 'review'|'new'; practice: Turn[]|null; estimate: number }>();
const emit=defineEmits<{ cancel: []; done: [session: {done:number;correct:number}]; online: [value:boolean]; stale: [] }>();
const turn=ref<Turn|null>(null), revealed=ref(false), answer=ref(''),usedHint=ref(false);
const feedback=ref<{correct:boolean;expected:string}|null>(null), choiceResult=ref<ChoiceResult|null>(null);
const input=ref<HTMLInputElement|null>(null), busy=ref(false),unsaved=ref(false),noAudio=ref<PlaybackFailure|null>(null),help=ref(false),failedLoad=ref(false);
const session=ref({done:0,correct:0}); const estimated=ref(props.estimate);
const card=computed(()=>turn.value?.card??null);
const completeLessonWordId=ref<number|null>(null);
const completeLessonReady=computed(()=>completeLessonWordId.value===card.value?.word_id);
function onLessonReady(wordId:number,ready:boolean){if(card.value?.word_id===wordId)completeLessonWordId.value=ready?wordId:null;}
const diff=computed(()=>charDiff(answer.value,feedback.value?.expected??''));
const practiceQueue=props.practice ? [...props.practice] : null;
const submitter=new PendingSubmitter((path,body)=>api(path,body));
let shownAt=0,pendingRating=0,alive=true,timer:number|undefined,audioRequest=0;
const progress=computed(()=>Math.min(100,session.value.done/Math.max(1,estimated.value)*100));
const lastPlaybackWord=ref<string|null>(null);
function cancelAudio(){audioRequest++;stopAudio();noAudio.value=null;lastPlaybackWord.value=null;}
async function play(word?:string|MouseEvent){
  if(!card.value)return;
  const n=++audioRequest;noAudio.value=null;
  const target=typeof word==='string'?word:card.value.headword;
  lastPlaybackWord.value=target;
  const result=await speak(target);
  if(!alive||n!==audioRequest||result.status==='cancelled')return;
  noAudio.value=result.status==='unavailable'?result.reason:null;
}
async function loadNext(){
  if(busy.value||unsaved.value)return;
  cancelAudio();busy.value=true;failedLoad.value=false;turn.value=null;completeLessonWordId.value=null;
  try{
    const next=practiceQueue ? (practiceQueue.shift()??null) : await api<Turn>('/api/next?prefer='+props.prefer);
    if(!alive)return;
    if(!next?.card){emit('done',session.value);return;}
    turn.value=next;revealed.value=false;answer.value='';usedHint.value=false;feedback.value=null;choiceResult.value=null;
    estimated.value=Math.max(estimated.value,session.value.done+1);shownAt=Date.now();
    emit('online',true);
    if(next.question?.qtype==='listen_choice'||next.card.mode==='dictation')play();
    await nextTick();if(next.card.mode!=='recognize')input.value?.focus();
  }catch(e){handleError(e);failedLoad.value=true;}finally{busy.value=false;}
}
function handleError(e:unknown){if(e instanceof ClientError)emit('stale');else if(e instanceof OfflineError)emit('online',false);else throw e;}
async function afterSaved(result:any){
  unsaved.value=false;emit('online',true);session.value.done++;
  if(turn.value?.question){choiceResult.value=result;if(result.correct)session.value.correct++;}
  else if(card.value?.mode==='recognize'){if(pendingRating>1)session.value.correct++;return true;}
  else{feedback.value={correct:result.correct,expected:result.expected};if(result.correct)session.value.correct++;}
  return false;
}
async function send(path:string,body:Record<string,unknown>){
  if(busy.value)return;busy.value=true;let advance=false;
  try{
    const result=unsaved.value ? await submitter.retry() : await submitter.submit(path,{...body,context:practiceQueue?'practice':'study',durationMs:Date.now()-shownAt});
    if(!alive)return;
    if(!result){unsaved.value=true;emit('online',false);}else advance=await afterSaved(result);
  }catch(e){unsaved.value=false;handleError(e);}finally{busy.value=false;}
  if(advance)await loadNext();
}
async function retry(){if(submitter.pending)await send(submitter.pending.path,submitter.pending.body);}
async function reconnect(){
  if(!unsaved.value||busy.value||!submitter.failed)return;
  busy.value=true;let advance=false;
  try{
    // Preserve PendingSubmitter's single automatic attempt until a health probe confirms reconnection.
    let healthy=false;try{healthy=(await fetch('/health')).ok;}catch{/* still offline */}
    if(!healthy){emit('online',false);return;}
    emit('online',true);
    const result=await submitter.onReconnect();if(result&&alive)advance=await afterSaved(result);
  }catch(e){unsaved.value=false;handleError(e);}finally{busy.value=false;}
  if(advance)await loadNext();
}
async function rate(rating:number){if(!card.value||!revealed.value||unsaved.value)return;pendingRating=rating;await send('/api/review',{cardId:card.value.id,rating});}
async function choose(choiceWordId:number){if(!turn.value?.question||choiceResult.value||unsaved.value)return;await send('/api/answer',{questionId:turn.value.question.id,choiceWordId});}
async function submit(){
  if(feedback.value||choiceResult.value){await loadNext();return;}
  if(!card.value||!answer.value.trim()||unsaved.value)return;
  await send('/api/check',{cardId:card.value.id,answer:answer.value,usedHint:usedHint.value});
}
function hint(){if(!card.value||feedback.value||unsaved.value||busy.value)return;usedHint.value=true;const first=card.value.headword[0];if(!answer.value.startsWith(first))answer.value=first+answer.value;}
function cancel(){if(!busy.value&&!unsaved.value){cancelAudio();emit('cancel');}}
function onKey(e:KeyboardEvent){
  const editing=e.target instanceof HTMLInputElement;
  if(e.key==='?'&&!editing){help.value=!help.value;e.preventDefault();return;}
  if(e.key==='Escape'){if(help.value)help.value=false;else cancel();e.preventDefault();return;}
  if(!card.value||busy.value||unsaved.value||help.value)return;
  const q=turn.value?.question;
  if(q){
    if(e.key==='r'||e.key==='R'||e.key===' '){play();e.preventDefault();}
    else if(!choiceResult.value&&/^[1-4]$/.test(e.key)){choose(q.options[Number(e.key)-1].wordId);e.preventDefault();}
    else if(choiceResult.value&&e.key==='Enter'){loadNext();e.preventDefault();}
  }else if(card.value.mode==='recognize'){
    if(e.key===' '||e.key.toLowerCase()==='r'){play();e.preventDefault();}
    else if(!revealed.value&&(e.key==='ArrowRight'||e.key==='Enter')){revealed.value=true;e.preventDefault();}
    else if(revealed.value&&/^[1-4]$/.test(e.key)){rate(Number(e.key));e.preventDefault();}
  }else{
    if(e.key==='Tab'&&!feedback.value){hint();e.preventDefault();}
    else if(e.key==='Enter'){submit();e.preventDefault();}
    else if(e.key.toLowerCase()==='r'&&(!editing||e.ctrlKey||e.altKey||feedback.value)){play();e.preventDefault();}
  }
}
onMounted(()=>{loadNext();window.addEventListener('keydown',onKey);window.addEventListener('online',reconnect);timer=window.setInterval(reconnect,5000);});
onUnmounted(()=>{alive=false;cancelAudio();clearInterval(timer);window.removeEventListener('keydown',onKey);window.removeEventListener('online',reconnect);});
</script>
<template><main class="study"><div class="studybar"><button class="x" title="暂停（Esc）" aria-label="暂停" :disabled="busy||unsaved" @click="cancel">×</button><div class="track" role="progressbar" :aria-valuenow="session.done" :aria-valuemax="estimated" aria-valuemin="0" aria-label="本轮进度"><span :style="{width:`${progress}%`}"></span></div><span class="small muted num">{{ session.done }} / {{ estimated }}</span></div>
  <article v-if="turn&&card" :key="`${card.id}-${turn.question?.id??session.done}`" class="card">
    <div class="meta"><span class="tag">{{ COPY.qtypes[turn.question?.qtype??card.mode] }}</span><span v-if="card.level==='三级'||card.level==='二级'" class="tag" :class="{core:card.level==='三级'}">{{ card.level==='三级'?'核心词':'二级词' }}</span><span v-if="isRepeatCard(card)" class="repeat" data-testid="repeat-line">{{ COPY.repeatCard }}</span></div>
    <ChoiceQuestion v-if="turn.question" :card="card" :question="turn.question" :result="choiceResult" :busy="busy||unsaved" @choose="choose" @next="loadNext" @play="play" />
    <RecognizeCard v-else-if="card.mode==='recognize'" :card="card" :revealed="revealed" :busy="busy||unsaved" :complete-lesson-ready="completeLessonReady" @reveal="revealed=true" @rate="rate" @play="play" />
    <template v-else>
      <div v-if="card.mode==='spell'" class="prompt"><div class="q">{{ COPY.spellPrompt }}</div><MeaningList :key="card.id" :meaning="card.meaning_zh" :flag="card.meaning_flag" :source="card.meaning_source" /><div v-if="card.phonetic" class="phon">{{ card.phonetic }}</div></div>
      <div v-else class="listen"><SpeakButton large @play="play" /><div><p>{{ COPY.dictationPrompt }}</p><p class="small muted">{{ COPY.listenHint }}</p></div></div>
      <form @submit.prevent="submit"><div class="spellbox"><input ref="input" v-model="answer" class="input" :disabled="!!feedback||unsaved||busy" autocomplete="off" autocapitalize="off" :spellcheck="false" aria-label="输入单词" placeholder="输入单词" /></div>
      <div v-if="feedback" class="fb" :class="feedback.correct?'ok':'bad'" role="status"><div><div class="t">{{ feedback.correct?COPY.correct:isNearMiss(answer,feedback.expected)?COPY.almost:COPY.spellWrong }}</div><template v-if="!feedback.correct"><div class="diff"><span class="lbl">{{ COPY.typed }}</span><span v-for="(c,i) in diff.typed" :key="`t${i}`" :class="{x:c.changed}">{{ c.char }}</span> → <span v-for="(c,i) in diff.expected" :key="`e${i}`" :class="{y:c.changed}">{{ c.char }}</span></div><div class="d small">{{ COPY.addedWrong }}</div></template></div></div>
      <ExplainPanel v-if="feedback" :word-id="card.word_id" context="answer" :hide-pending="completeLessonReady" />
      <MeaningList v-if="feedback&&card.mode==='dictation'" :key="card.id" :meaning="card.meaning_zh" :flag="card.meaning_flag" :source="card.meaning_source" />
      <div class="after"><span class="small muted">{{ COPY.spellHint }}</span><button type="submit" class="btn primary" :disabled="busy||unsaved||(!feedback&&!answer.trim())">{{ feedback?COPY.next:'提交' }}</button></div></form>
    </template>
    <AnswerLesson v-if="feedback || choiceResult || (!turn.question && card.mode==='recognize' && revealed)" :key="card.word_id" :word-id="card.word_id" :headword="card.headword" @ready="onLessonReady" @play="play" @cancel-playback="cancelAudio" />
    <p v-if="noAudio" class="note" role="status">{{ noAudio==='blocked'?COPY.audioBlocked:COPY.audioUnavailable }} <button type="button" class="link" @click="play(lastPlaybackWord??undefined)">{{ COPY.audioRetry }}</button></p>
    <p v-if="unsaved" class="retry" role="status">{{ COPY.unsaved }} <button class="btn" :disabled="busy" @click="retry">{{ COPY.retry }}</button></p>
  </article>
  <div v-else-if="failedLoad" class="panel"><button class="btn primary" @click="loadNext">{{ COPY.retry }}</button></div>
  <div v-if="card?.mode==='recognize'&&!turn?.question&&!revealed" class="hints"><span><kbd>空格</kbd>听发音</span><span><kbd>→</kbd>翻面</span><span><kbd>Esc</kbd>暂停</span></div>
  <div v-else class="hints"><span><kbd>1</kbd>–<kbd>4</kbd>自评 / 选项</span><span><kbd>R</kbd>重听</span><span><kbd>Esc</kbd>暂停</span></div>
  <button class="link" :aria-expanded="help" @click="help=!help">? 快捷键表</button>
  <a class="link small" href="/api/pronunciation/credits" target="_blank" rel="noopener noreferrer">{{ COPY.audioCredits }}</a>
  <div v-if="help" class="help"><dl><dt>空格 / R</dt><dd>听发音（输入框内用 Ctrl+R）</dd><dt>→ / Enter</dt><dd>翻面</dd><dt>1–4</dt><dd>自评 / 选项</dd><dt>Tab</dt><dd>提示首字母</dd><dt>Enter</dt><dd>提交 / 下一个</dd><dt>Esc</dt><dd>暂停</dd><dt>?</dt><dd>快捷键表</dd></dl></div>
</main></template>
