<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue';
import {api,speak,stopAudio,pronunciationCreditsUrl,type PlaybackFailure} from '../api';
import {pronunciationHeadword} from '../audio';
import {COPY} from '../copy';
import type {WordDetail} from '../types';
import type {WordLesson,WordLessonResponse} from '../../../shared/lesson';
import MeaningList from '../MeaningList.vue';
import SpeakButton from '../components/SpeakButton.vue';
import ExplainPanel from '../components/ExplainPanel.vue';
import StatusChip from '../components/StatusChip.vue';
import SenseLesson from '../components/SenseLesson.vue';
import {hasDictionaryPlaceholder} from '../../../server/src/text';

const props=defineProps<{wordId:number;initial?:WordDetail;automaticBooks?:boolean}>();
defineEmits<{back:[]}>();
const detail=ref<WordDetail|null>(props.initial??null),busy=ref(false),failed=ref(false),audioFailed=ref<PlaybackFailure|null>(null);
const pronunciationNote=ref<string|null>(null),systemSpeech=ref(false);
const recordingIpa=ref<string|null>(null);
const recordingReady=ref(false);
const pronunciationVariants=ref<{variant:'noun'|'verb';label:string;ipa?:string;pronunciationNote?:string}[]>([]);
const lastPlaybackVariant=ref<'noun'|'verb'|undefined>();
const lastPlaybackWord=ref<string|null>(null);
const pronunciationAccent=ref<'us'|'uk'|null>(null);
const loadedLesson=ref<WordLesson|null>(null),lessonFailed=ref(false);
let alive=true,request=0,audioRequest=0,pronunciationRequest=0,lessonRequest=0;
const card=computed(()=>detail.value!.word);
const recognitionOnly=computed(()=>hasDictionaryPlaceholder(detail.value?.word.headword??''));
const visibleEvidence=computed(()=>detail.value?.capabilityEvidence?.filter(e=>!recognitionOnly.value||e.mode==='recognize')??[]);
// The response is fetched independently; never show a lesson for a different card.
const lesson=computed(()=>loadedLesson.value?.wordId===detail.value?.word.id
  &&loadedLesson.value?.headword===detail.value?.word.headword?loadedLesson.value:null);
const phonetic=computed(()=>{
  const pronunciation=lesson.value?.pronunciation;
  return recordingIpa.value||(pronunciationAccent.value?pronunciation?.[pronunciationAccent.value]:null)
    ||pronunciation?.ipa||detail.value?.word.phonetic
    ||(pronunciation?.uk?`英式 ${pronunciation.uk}`:pronunciation?.us?`美式 ${pronunciation.us}`:null);
});
function date(iso:string){return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric'}).format(new Date(iso));}
async function load(){
  const n=++request;failed.value=false;
  try{const d=await api<WordDetail>(`/api/word/${props.wordId}`);if(alive&&n===request)detail.value=d;}
  catch{if(alive&&n===request)failed.value=true;}
}
async function loadLesson(){
  const n=++lessonRequest,id=props.wordId;loadedLesson.value=null;lessonFailed.value=false;
  try{
    const result=await api<WordLessonResponse>(`/api/word/${id}/lesson`);
    if(!alive||n!==lessonRequest)return;
    if(result?.status==='ready'&&result.lesson?.wordId===id)loadedLesson.value=result.lesson;
  }catch{if(alive&&n===lessonRequest)lessonFailed.value=true;}
}
async function wrong(){
  if(busy.value||!detail.value)return;
  const id=props.wordId,inBook=!detail.value.wrong?.inBook;
  busy.value=true;
  try{await api('/api/wrong/'+id,{inBook});if(alive&&id===props.wordId)await load();}
  catch{if(alive&&id===props.wordId)failed.value=true;}
  finally{if(alive)busy.value=false;}
}
async function loadPronunciationNote(){
  const n=++pronunciationRequest;recordingReady.value=false;pronunciationNote.value=null;pronunciationAccent.value=null;recordingIpa.value=null;pronunciationVariants.value=[];
  const word=pronunciationHeadword(detail.value?.word.headword??'');if(!word)return;
  try{
    const data=await api<{status:string;accent?:string;ipa?:string;pronunciationNote?:string;variants?:{variant:'noun'|'verb';label:string;ipa?:string;pronunciationNote?:string}[]}>(`/api/pronunciation?word=${encodeURIComponent(word)}`);
    if(alive&&n===pronunciationRequest){
      pronunciationVariants.value=Array.isArray(data.variants)?data.variants.filter(v=>v.variant==='noun'||v.variant==='verb'):[];
      recordingReady.value=data?.status==='ready'||pronunciationVariants.value.length>0;
      if(data?.status!=='ready')return;
      recordingIpa.value=typeof data.ipa==='string'&&data.ipa.trim()?data.ipa.trim():null;
      pronunciationAccent.value=data.accent==='us'||data.accent==='uk'?data.accent:null;
      const accent=data.accent==='us'?'美式录音':data.accent==='uk'?'英式录音':'';
      pronunciationNote.value=[accent,typeof data.pronunciationNote==='string'?data.pronunciationNote.trim():''].filter(Boolean).join(' · ')||null;
    }
  }catch{/* Optional recording metadata must never block the word or its audio button. */}
}
function cancelAudio(){audioRequest++;stopAudio();audioFailed.value=null;lastPlaybackWord.value=null;lastPlaybackVariant.value=undefined;systemSpeech.value=false;}
async function play(word?:string|MouseEvent,variant?:'noun'|'verb'){
  if(!detail.value)return;
  const n=++audioRequest;audioFailed.value=null;systemSpeech.value=false;
  const target=typeof word==='string'?word:detail.value.word.headword;
  lastPlaybackWord.value=target;lastPlaybackVariant.value=variant;
  const result=await speak(target,variant);
  if(!alive||n!==audioRequest||result.status==='cancelled')return;
  audioFailed.value=result.status==='unavailable'?result.reason:null;
  systemSpeech.value=result.status==='success'&&result.source==='system';
}
onMounted(()=>{loadLesson();loadPronunciationNote();if(!props.initial)load();});
watch(()=>detail.value?.word.headword,loadPronunciationNote);
watch(()=>props.wordId,()=>{cancelAudio();detail.value=null;loadLesson();load();});
onUnmounted(()=>{alive=false;request++;lessonRequest++;pronunciationRequest++;cancelAudio();});
</script>

<template>
  <main class="page lesson-page">
    <button type="button" class="back link" @click="$emit('back')">{{ COPY.back }}</button>
    <div v-if="detail" class="wdetail lesson-layout">
      <article class="card wd-main">
        <p v-if="recognitionOnly" class="small muted">本词条仅评估认词，暂不测拼写和听写。</p>
        <details v-if="detail.capabilityEvidence" class="evidence-detail"><summary>{{ recognitionOnly?'认词的学习情况':'认义、拼写与听写的学习情况' }}</summary><p v-for="e in visibleEvidence" :key="e.mode" class="small muted">{{ {recognize:'认义',spell:'汉译英',dictation:'听写'}[e.mode] }}：{{ e.delayedSuccesses?'已有延迟记住的记录':'仍需跨日验证' }}<span v-if="e.lastFailureAt"> · {{ e.delayedSuccesses<2?'需要继续巩固':'已复查' }}</span><span v-if="e.verificationDue"> · {{ date(e.verificationDue) }}起复查</span></p></details>
        <div class="meta">
          <span v-if="detail.word.source==='kb2022'" class="tag" :class="{core:detail.word.level==='三级'}">{{ detail.word.level==='三级'?COPY.core:COPY.level2 }}</span>
          <StatusChip :status="detail.status" />
          <span v-if="!automaticBooks&&detail.wrong?.inBook" class="wb">{{ COPY.wrongBook }}</span>
        </div>
        <h1 class="word"><span>{{ detail.word.headword }}</span><SpeakButton @play="play" /></h1>
        <div class="lesson-pronunciation">
          <div v-if="phonetic" class="phon">{{ phonetic }}</div>
          <p v-if="systemSpeech||pronunciationNote" class="small muted pronunciation-note" aria-label="发音说明">{{ systemSpeech?'系统合成发音':pronunciationNote }}</p>
          <p v-if="recordingReady&&!systemSpeech" class="small muted"><a class="link" :href="pronunciationCreditsUrl(detail.word.headword)" target="_blank" rel="noopener noreferrer">{{ COPY.audioCredits }}</a></p>
        </div>
        <div v-if="pronunciationVariants.length" class="pronunciation-variants" aria-label="不同读音"><button v-for="item in pronunciationVariants" :key="item.variant" type="button" class="btn" @click="play(undefined,item.variant)">▶ {{ item.label }} <span v-if="item.ipa">{{ item.ipa }}</span> <span v-if="item.pronunciationNote">· {{ item.pronunciationNote }}</span></button></div>
        <p v-if="audioFailed" class="note" role="status">{{ audioFailed==='blocked'?COPY.audioBlocked:COPY.audioUnavailable }} <button type="button" class="link" @click="play(lastPlaybackWord??undefined,lastPlaybackVariant)">{{ COPY.audioRetry }}</button></p>
        <details v-if="detail.memberships?.length" class="lesson-record"><summary>词书与单元</summary><p v-for="m in detail.memberships" :key="m.bookId+String(m.unitId)" class="small muted">{{ m.bookTitle }}<span v-if="m.unitTitle"> · {{ m.unitTitle }}</span></p></details>
        <details :key="wordId" class="lesson-record">
          <summary>学习记录 <span>认词 · 拼写 · 听写</span></summary>
          <div class="cards3">
            <div v-for="mode in (['recognize','spell','dictation'] as const)" :key="mode" class="c">
              <span>{{ COPY.qtypes[mode] }}</span>
              <span>{{ detail.statusDetail[mode]?COPY.cardStates[detail.statusDetail[mode]!.state]+' · '+date(detail.statusDetail[mode]!.due):COPY.noCard }}</span>
            </div>
          </div>
          <div v-if="!automaticBooks" class="record-wrong">
            <template v-if="detail.wrong?.inBook">
              <p class="small"><span class="wb">{{ COPY.inWrong }}</span> {{ COPY.wrongCount(detail.wrong.wrong_count) }}</p>
              <p class="small muted"><span class="dots3"><i v-for="n in 3" :key="n" :class="{on:n<=detail.wrong.correct_days.length}"></i></span>{{ COPY.correctDays(detail.wrong.correct_days.length) }} · {{ COPY.wrongRule }}</p>
            </template>
            <p v-else class="small muted">{{ COPY.notInWrong }}</p>
            <button class="btn" type="button" :disabled="busy" @click="wrong">{{ detail.wrong?.inBook?COPY.removeWrong:COPY.addWrong }}</button>
            <p v-if="!detail.wrong?.inBook" class="note">{{ COPY.lookupWrongNote }}</p>
            <p v-else-if="!detail.statusDetail.recognize" class="note">这个词还没开始认词，暂时不会进入“练错词”。</p>
          </div>
        </details>
        <SenseLesson v-if="lesson" :key="wordId" :lesson="lesson" @play="play" @cancel-playback="cancelAudio" />
        <template v-else>
          <p v-if="lessonFailed" class="note" role="status">完整讲解暂时未能载入。<button type="button" class="link" @click="loadLesson">重试讲解</button></p>
          <MeaningList :key="wordId" :meaning="card.meaning_zh" :source="card.meaning_source" :flag="card.meaning_flag" />
          <ExplainPanel v-if="detail.word.source!=='vocabulary'||detail.content.blocks.length" :key="wordId" :word-id="wordId" context="word" :content="detail.content" />
        </template>
      </article>
    </div>
    <p v-if="failed" class="note"><button type="button" class="btn" @click="load">{{ COPY.retry }}</button></p>
  </main>
</template>

<style scoped>
.lesson-page { max-width: 1040px; padding-top: 16px; }
.lesson-layout { display:block; }
.lesson-layout .wd-main { padding: 28px 32px; min-width:0; }
.lesson-layout .meta { flex-wrap: wrap; margin-bottom: 8px; }
.lesson-layout .word { margin-bottom: 12px; font-size: 60px; overflow-wrap: anywhere; }
.lesson-layout .word > span { min-width: 0; }
.lesson-pronunciation { display: flex; gap: 8px 18px; flex-wrap: wrap; align-items: baseline; }
.lesson-pronunciation p { margin: 0; }
.pronunciation-variants { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
.pronunciation-variants .btn { font-size:14px; }
.lesson-layout .pronunciation-note { margin: 6px 0 0; }
.lesson-record { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); margin: 16px 0 22px; padding: 12px 0; }
.lesson-record summary { color: var(--ink-2); cursor: pointer; font-size: 13px; }
.lesson-record summary span { margin-left: 10px; color: var(--ink-3); }
.lesson-record .cards3 { margin-top: 14px; grid-template-columns: repeat(3,minmax(0,1fr)); }
.lesson-record .c { align-items: flex-start; flex-direction: column; }
.lesson-record p { margin-bottom: 0; }
.record-wrong { border-top: 1px solid var(--line); margin-top: 16px; padding-top: 10px; }
.record-wrong .btn { margin-top: 12px; }
@media (max-width: 640px) {
  .lesson-page { padding: 18px 12px 100px; }
  .lesson-layout .wd-main { padding: 24px 20px; }
  .lesson-layout .word { font-size: 44px; }
  .lesson-record .cards3 { grid-template-columns: 1fr; }
  .lesson-record .c { flex-direction: row; }
}
</style>
