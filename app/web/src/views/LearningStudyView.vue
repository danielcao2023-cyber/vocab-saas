<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue';
import {api,speak,stopAudio,ClientError,type PlaybackFailure} from '../api';
import {PendingSubmitter} from '../pending';
import type {LearningTurn,LearningResult,LearningSummary} from '../../../shared/learning';
import FocusStudyCard from '../components/FocusStudyCard.vue';
const props=withDefaults(defineProps<{active?:boolean}>(),{active:true});
const emit=defineEmits<{cancel:[];open:[wordId:number];updated:[]}>();
const turn=ref<LearningTurn|null>(null),answer=ref(''),feedback=ref<LearningResult|null>(null),busy=ref(false),unsaved=ref(false),error=ref(''),audioFailed=ref<PlaybackFailure|null>(null);
const submitter=new PendingSubmitter((path,body)=>api(path,body));let alive=true,version=0,audioVersion=0,shownAt=Date.now();
const summary=computed<LearningSummary|null>(()=>turn.value?.summary??null);

function stop(){audioVersion++;stopAudio();audioFailed.value=null;}
async function play(){const card=turn.value?.card;if(!card||!props.active)return;const n=++audioVersion;audioFailed.value=null;const result=await speak(card.audioWord??card.headword??'');if(alive&&n===audioVersion&&result.status==='unavailable')audioFailed.value=result.reason;}
async function load(){if(busy.value||unsaved.value)return;const n=++version;busy.value=true;error.value='';stop();
 try{await api('/api/learning/start',{});const next=await api<LearningTurn>('/api/learning/next');if(!alive||n!==version)return;turn.value=next;answer.value='';feedback.value=null;shownAt=Date.now();emit('updated');if(next.card?.mode==='dictation'&&props.active)void play();}
 catch{if(alive&&n===version)error.value='任务暂时未能载入，请重试。';}finally{if(alive&&n===version)busy.value=false;}
}
function received(result:LearningResult){feedback.value=result;unsaved.value=false;emit('updated');}
async function submit(choiceId?:number){const card=turn.value?.card;if(!card||busy.value||feedback.value||unsaved.value)return;
 if(card.mode!=='recognize'&&!answer.value.trim())return;busy.value=true;error.value='';
 try{const result=await submitter.submit('/api/learning/answer',{issueId:card.issueId,...(card.mode==='recognize'?{choiceId}:{answer:answer.value}),durationMs:Math.min(300000,Math.max(0,Date.now()-shownAt))});if(!alive)return;if(result)received(result);else unsaved.value=true;}
 catch(e){if(alive)error.value=e instanceof ClientError?'题目已更新，请刷新任务后继续。':'保存失败，请重试。';}finally{if(alive)busy.value=false;}
}
async function retry(){if(busy.value||!submitter.pending)return;busy.value=true;error.value='';try{const result=await submitter.retry();if(alive&&result)received(result);}catch{if(alive){unsaved.value=false;error.value='题目已更新，请刷新任务。';}}finally{if(alive)busy.value=false;}}
async function consult(){const card=turn.value?.card;if(!card||busy.value||unsaved.value)return;if(feedback.value){stop();emit('open',card.wordId);return;}busy.value=true;error.value='';
 try{await api('/api/learning/consult',{issueId:card.issueId});if(alive){card.assisted=true;stop();emit('open',card.wordId);}}
 catch{if(alive)error.value='暂时无法打开学习页，请重试。';}finally{if(alive)busy.value=false;}
}
async function defer(){const card=turn.value?.card;if(!card||busy.value||unsaved.value)return;busy.value=true;error.value='';try{await api('/api/learning/defer',{issueId:card.issueId});}catch{if(alive)error.value='暂缓未能保存，请重试。';}finally{if(alive)busy.value=false;}if(alive&&!error.value)await load();}
async function reconnect(){if(!unsaved.value||busy.value||!props.active)return;try{if((await fetch('/health')).ok)await retry();}catch{/* Keep original question until it is saved. */}}
function pause(){if(!busy.value&&!unsaved.value){stop();emit('cancel');}}
watch(()=>props.active,active=>{stop();if(active)shownAt=Date.now();});
onMounted(()=>{load();window.addEventListener('online',reconnect);});
onUnmounted(()=>{alive=false;version++;stop();window.removeEventListener('online',reconnect);});
</script>
<template><main class="page learning-study"><div class="learning-studybar"><button class="btn" type="button" :disabled="busy||unsaved" @click="pause">暂停</button><span v-if="summary" class="muted small">今日 {{ summary.completed }} / {{ summary.total }} 词</span></div>
 <FocusStudyCard v-if="turn?.kind==='card'&&turn.card" :key="turn.card.issueId" :card="turn.card" v-model:answer="answer" :feedback="feedback" :busy="busy||unsaved||!active" :audio-failed="audioFailed" @choose="submit" @submit="submit()" @next="load" @play="play" @learn="consult" @defer="defer" />
 <section v-else-if="turn?.kind==='done'" class="panel learning-message"><h1>{{ summary?.deferred?'本轮练习已结束':'今天的任务完成了' }}</h1><p>完成 {{ summary?.completed }} 个词 · 答题 {{ summary?.answers }} 次</p><p v-if="summary?.deferred">{{ summary.deferred }} 个词因读音暂缓，后续继续安排。</p><button class="btn primary" @click="pause">回到今日</button></section>
 <p v-else-if="!error" class="note">正在准备卡片…</p>
 <div v-if="unsaved" class="learning-message panel" role="status">答案尚未保存，请保持本题。<button class="btn" :disabled="busy" @click="retry">重试保存</button></div>
 <div v-if="error" class="note" role="status">{{ error }} <button class="btn" :disabled="busy||unsaved" @click="load">刷新任务</button></div>
</main></template>
<style scoped>.learning-study{max-width:780px;padding-top:22px;}.learning-studybar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}.learning-studybar .btn{padding:8px 16px;}.learning-message{max-width:720px;margin:20px auto;}.learning-message h1{font-size:24px;}.learning-message .btn{margin:8px 8px 0 0;}@media(max-width:640px){.learning-study{padding:16px 12px 40px;}}</style>
