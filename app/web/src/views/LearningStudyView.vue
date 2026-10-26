<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,shallowRef,watch} from 'vue';
import {api,speak,stopAudio,ClientError,type PlaybackFailure} from '../api';
import {ForegroundClock} from '../foreground-clock';
import {PendingSubmitter,newAnswerId} from '../pending';
import type {LearningTurnV3,LearningResultV3,LearningSummaryV3} from '../../../shared/learning';
import FocusStudyCard from '../components/FocusStudyCard.vue';
import {preferences} from '../preferences';
const props=withDefaults(defineProps<{active?:boolean}>(),{active:true});
const emit=defineEmits<{cancel:[];open:[wordId:number];updated:[]}>();
const turn=ref<LearningTurnV3|null>(null),answer=ref(''),feedback=ref<LearningResultV3|null>(null),busy=ref(false),unsaved=ref(false),error=ref(''),audioFailed=ref<PlaybackFailure|null>(null);
const submitter=new PendingSubmitter((path,body)=>api(path,body));let alive=true,audioVersion=0,clock=new ForegroundClock(),didStart=false;
const pendingOperation=shallowRef<(()=>Promise<void>)|null>(null);
const summary=computed<LearningSummaryV3|null>(()=>turn.value?.summary??null);

function stop(){audioVersion++;stopAudio();audioFailed.value=null;}
async function play(){const card=turn.value?.card;if(!card||!props.active)return;const n=++audioVersion;audioFailed.value=null;const result=await speak(card.audioWord??card.headword??'');if(alive&&n===audioVersion&&result.status==='unavailable')audioFailed.value=result.reason;}
// Keep the exact failed request and its next step. Earlier successful steps must
// not be replayed while the offline runtime is waiting to persist this one.
async function storedRequest<T>(path:string,body:unknown,accept:(result:T)=>void|Promise<void>,message:string){
 busy.value=true;error.value='';
 try{
  const result=await api<T>(path,body);if(!alive)return;
  pendingOperation.value=null;unsaved.value=false;await accept(result);
 }catch(e){if(alive){
  if(e instanceof ClientError){pendingOperation.value=null;unsaved.value=false;error.value='题目已更新，请刷新任务后继续。';}
  else{pendingOperation.value=()=>storedRequest(path,body,accept,message);unsaved.value=true;error.value=message;}
 }}finally{if(alive)busy.value=false;}
}
async function fetchTurn(){
 await storedRequest<LearningTurnV3>('/api/learning/next',undefined,async next=>{
  if(next.kind==='idle'){didStart=false;await startTurn();return;}
  turn.value=next;answer.value='';feedback.value=null;clock.reset(props.active&&document.visibilityState!=='hidden');emit('updated');
  if(next.card?.mode==='dictation'&&props.active&&preferences.dictationAutoPlay)void play();
 },'任务暂时未能载入，请重试保存。');
}
async function startTurn(){
 await storedRequest('/api/learning/start',{policyVersion:3},async()=>{didStart=true;await fetchTurn();},'任务暂时未能载入，请重试保存。');
}
async function load(){
 if(busy.value||unsaved.value)return;stop();
 if(didStart)await fetchTurn();else await startTurn();
}
function received(result:LearningResultV3){feedback.value=result;clock.setActive(false);unsaved.value=false;emit('updated');}
async function submit(choiceId?:number){const card=turn.value?.card;if(!card||busy.value||feedback.value||unsaved.value)return;
 if(card.mode!=='recognize'&&!answer.value.trim())return;busy.value=true;error.value='';
 try{const result=await submitter.submit('/api/learning/answer',{policyVersion:3,issueId:card.issueId,...(card.mode==='recognize'?{choiceId}:{answer:answer.value}),durationMs:clock.elapsed()});if(!alive)return;if(result)received(result);else unsaved.value=true;}
 catch(e){if(alive)error.value=e instanceof ClientError?'题目已更新，请刷新任务后继续。':'保存失败，请重试。';}finally{if(alive)busy.value=false;}
}
async function retry(){if(busy.value)return;if(pendingOperation.value){await pendingOperation.value();return;}if(!submitter.pending)return;busy.value=true;error.value='';try{const result=await submitter.retry();if(alive&&result)received(result);}catch{if(alive){unsaved.value=false;error.value='题目已更新，请刷新任务。';}}finally{if(alive)busy.value=false;}}
async function consult(){const card=turn.value?.card;if(!card||busy.value||unsaved.value)return;
 const afterAnswer=!!feedback.value,eventId=newAnswerId();
 const path=afterAnswer?'/api/learning/exposure':'/api/learning/consult';
 const body=afterAnswer?{policyVersion:3,wordId:card.wordId,issueId:card.issueId,eventId,reason:'lesson_after_answer'}:{policyVersion:3,issueId:card.issueId,eventId};
 await storedRequest(path,body,()=>{if(!afterAnswer)card.assisted=true;clock.setActive(false);stop();emit('open',card.wordId);},'暂时无法打开学习页，请重试保存。');
}
async function defer(){const card=turn.value?.card;if(!card||busy.value||unsaved.value)return;await storedRequest('/api/learning/defer',{policyVersion:3,issueId:card.issueId},fetchTurn,'暂缓未能保存，请重试保存。');}
async function reconnect(){if(!unsaved.value||busy.value||!props.active)return;try{if((await fetch('/health')).ok)await retry();}catch{/* Keep original question until it is saved. */}}
function pause(){if(!busy.value&&!unsaved.value){clock.setActive(false);stop();emit('cancel');}}
function visibility(){clock.setActive(props.active&&document.visibilityState!=='hidden'&&!feedback.value&&!busy.value);}
watch(()=>props.active,()=>{stop();visibility();});
onMounted(()=>{load();document.addEventListener?.('visibilitychange',visibility);window.addEventListener('online',reconnect);window.addEventListener('xiaobei:pause-study',pause);});
onUnmounted(()=>{alive=false;clock.setActive(false);document.removeEventListener?.('visibilitychange',visibility);stop();window.removeEventListener('online',reconnect);window.removeEventListener('xiaobei:pause-study',pause);});
</script>
<template><main class="page learning-study"><div class="learning-studybar"><button class="btn" type="button" :disabled="busy||unsaved" @click="pause">暂停</button><span v-if="summary" class="muted small">今日已练 {{ summary.touched??summary.completed }} / {{ summary.total }} 词</span></div>
 <FocusStudyCard v-if="turn?.kind==='card'&&turn.card" :key="turn.card.issueId" :card="turn.card" v-model:answer="answer" :feedback="feedback" :busy="busy||unsaved||!active" :audio-failed="audioFailed" @choose="submit" @submit="submit()" @next="load" @play="play" @learn="consult" @defer="defer" />
 <section v-else-if="turn?.kind==='done'" class="panel learning-message"><h1>本段练习已结束</h1><p>今天练了 {{ summary?.touched??summary?.completed }} 个词<span v-if="summary?.needsConsolidation">，{{ summary.needsConsolidation }} 个还需巩固</span></p><p v-if="summary?.deferred">{{ summary.deferred }} 个词因读音暂缓，后续继续安排。</p><button class="btn primary" @click="pause">回到今日</button></section>
 <section v-else-if="turn?.kind==='waiting'" class="panel learning-message"><h1>本段练习已结束</h1><p>稍后还有 {{ summary?.pendingLater }} 个词需要复查，可以先休息。</p><button class="btn primary" @click="pause">回到今日</button><button class="btn" @click="load">检查复查任务</button></section>
 <p v-else-if="!error" class="note">正在准备卡片…</p>
 <div v-if="unsaved" class="learning-message panel" role="status">{{ pendingOperation?'记录尚未保存，请保持当前页面。':'答案尚未保存，请保持本题。' }}<button class="btn" :disabled="busy" @click="retry">重试保存</button></div>
 <div v-if="error" class="note" role="status">{{ error }} <button class="btn" :disabled="busy||unsaved" @click="load">刷新任务</button></div>
</main></template>
<style scoped>.learning-study{max-width:780px;padding-top:22px;}.learning-studybar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}.learning-studybar .btn{padding:8px 16px;}.learning-message{max-width:720px;margin:20px auto;}.learning-message h1{font-size:24px;}.learning-message .btn{margin:8px 8px 0 0;}@media(max-width:640px){.learning-study{padding:16px 12px 40px;}}</style>
