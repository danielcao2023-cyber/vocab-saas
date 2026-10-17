<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue';
import {api,speak,stopAudio,pronunciationCreditsUrl,type PlaybackFailure} from '../api';
import {mainHeadwords} from '../../../server/src/text';
import {COPY} from '../copy';
import type {WordDetail} from '../types';
import MeaningList from '../MeaningList.vue';
import SpeakButton from '../components/SpeakButton.vue';
import ExplainPanel from '../components/ExplainPanel.vue';
import StatusChip from '../components/StatusChip.vue';
const props=defineProps<{wordId:number;initial?:WordDetail}>();defineEmits<{back:[]}>();
const detail=ref<WordDetail|null>(props.initial??null),busy=ref(false),failed=ref(false),audioFailed=ref<PlaybackFailure|null>(null);let alive=true,request=0,audioRequest=0;
const pronunciationNote=ref<string|null>(null);let pronunciationRequest=0;
const card=computed(()=>detail.value!.word);
function date(iso:string){return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric'}).format(new Date(iso));}
async function load(){const n=++request;failed.value=false;try{const d=await api<WordDetail>(`/api/word/${props.wordId}`);if(alive&&n===request)detail.value=d;}catch{if(alive&&n===request)failed.value=true;}}
async function wrong(){if(busy.value||!detail.value)return;busy.value=true;try{await api('/api/wrong/'+props.wordId,{inBook:!detail.value.wrong?.inBook});await load();}catch{failed.value=true;}finally{busy.value=false;}}
async function loadPronunciationNote(){
  const n=++pronunciationRequest;pronunciationNote.value=null;
  const word=mainHeadwords(detail.value?.word.headword??'')[0];if(!word)return;
  try{
    const data=await api<{status:string;accent?:string;pronunciationNote?:string}>(`/api/pronunciation?word=${encodeURIComponent(word)}`);
    if(alive&&n===pronunciationRequest&&data?.status==='ready'){
      const accent=data.accent==='us'?'美式录音':data.accent==='uk'?'英式录音':'';
      pronunciationNote.value=[accent,typeof data.pronunciationNote==='string'?data.pronunciationNote.trim():''].filter(Boolean).join(' · ')||null;
    }
  }catch{/* Optional recording metadata must never block the word or its audio button. */}
}
function cancelAudio(){audioRequest++;stopAudio();audioFailed.value=null;}
async function play(){
  if(!detail.value)return;
  const n=++audioRequest;audioFailed.value=null;
  const result=await speak(detail.value.word.headword);
  if(!alive||n!==audioRequest||result.status==='cancelled')return;
  audioFailed.value=result.status==='unavailable'?result.reason:null;
}
onMounted(()=>{loadPronunciationNote();if(!props.initial)load();});watch(()=>detail.value?.word.headword,loadPronunciationNote);
watch(()=>props.wordId,()=>{cancelAudio();detail.value=null;load();});onUnmounted(()=>{alive=false;pronunciationRequest++;cancelAudio();});
</script>
<template><main class="page"><button type="button" class="back link" @click="$emit('back')">{{ COPY.back }}</button><div v-if="detail" class="wdetail"><article class="card wd-main"><div class="meta"><span class="tag" :class="{core:detail.word.level==='三级'}">{{ detail.word.level==='三级'?COPY.core:COPY.level2 }}</span><StatusChip :status="detail.status" /><span v-if="detail.wrong?.inBook" class="wb">{{ COPY.wrongBook }}</span></div><div class="word"><span>{{ detail.word.headword }}</span><SpeakButton @play="play" /></div><div v-if="card.phonetic" class="phon">{{ detail.word.phonetic }}</div><p v-if="pronunciationNote" class="small muted pronunciation-note" aria-label="发音说明">{{ pronunciationNote }}</p><p class="small muted"><a class="link" :href="pronunciationCreditsUrl(detail.word.headword)" target="_blank" rel="noopener noreferrer">{{ COPY.audioCredits }}</a></p><p v-if="audioFailed" class="note" role="status">{{ audioFailed==='blocked'?COPY.audioBlocked:COPY.audioUnavailable }} <button type="button" class="link" @click="play">{{ COPY.audioRetry }}</button></p><div class="divider"></div><MeaningList :key="wordId" :meaning="card.meaning_zh" :source="card.meaning_source" :flag="card.meaning_flag" /><ExplainPanel :key="wordId" :word-id="wordId" context="word" :content="detail.content" /></article><aside class="wd-side"><section class="panel"><h2>{{ COPY.learningStatus }}</h2><p><StatusChip :status="detail.status" /> <span v-if="detail.statusDetail.recognize">{{ COPY.qtypes.recognize }}{{ COPY.nextReview }}{{ date(detail.statusDetail.recognize.due) }}</span></p><div class="cards3"><div v-for="mode in (['recognize','spell','dictation'] as const)" :key="mode" class="c"><span>{{ COPY.qtypes[mode] }}</span><span>{{ detail.statusDetail[mode]?COPY.cardStates[detail.statusDetail[mode]!.state]+' · '+date(detail.statusDetail[mode]!.due):COPY.noCard }}</span></div></div></section><section class="panel wbbox"><h2>{{ COPY.wrongBook }}</h2><template v-if="detail.wrong?.inBook"><p><span class="wb">{{ COPY.inWrong }}</span> {{ COPY.wrongCount(detail.wrong.wrong_count) }}</p><p class="small muted"><span class="dots3"><i v-for="n in 3" :key="n" :class="{on:n<=detail.wrong.correct_days.length}"></i></span>{{ COPY.correctDays(detail.wrong.correct_days.length) }} · {{ COPY.wrongRule }}</p></template><p v-else>{{ COPY.notInWrong }}</p><button class="btn" type="button" :disabled="busy" @click="wrong">{{ detail.wrong?.inBook?COPY.removeWrong:COPY.addWrong }}</button><p v-if="!detail.wrong?.inBook" class="note">{{ COPY.lookupWrongNote }}</p></section></aside></div><p v-if="failed" class="note"><button type="button" class="btn" @click="load">{{ COPY.retry }}</button></p></main></template>
