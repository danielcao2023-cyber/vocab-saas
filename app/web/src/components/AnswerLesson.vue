<script setup lang="ts">
import {onMounted,onUnmounted,ref,watch} from 'vue';
import {api} from '../api';
import type {WordLesson,WordLessonResponse} from '../../../shared/lesson';
import SenseLesson from './SenseLesson.vue';
import type {RecordingPlayback} from '../audio';

// Mount only once the answer has been revealed or feedback has been received.
const props=defineProps<{wordId:number;headword:string;playback?:RecordingPlayback|null}>();
const emit=defineEmits<{ready:[wordId:number,ready:boolean];play:[headword:string];'cancel-playback':[]}>();
const lesson=ref<WordLesson|null>(null);
let alive=true,request=0;
async function load(){
  const n=++request,id=props.wordId,headword=props.headword;lesson.value=null;emit('ready',id,false);
  try{
    const result=await api<WordLessonResponse>(`/api/word/${id}/lesson`);
    if(alive&&n===request&&result?.status==='ready'&&result.lesson?.wordId===id&&result.lesson.headword===headword){lesson.value=result.lesson;emit('ready',id,true);}
  }catch{/* The short explanation remains usable when a complete lesson is unavailable. */}
}
onMounted(load);
watch(()=>[props.wordId,props.headword],load);
onUnmounted(()=>{alive=false;request++;});
function readingKey(event:KeyboardEvent){
  // Native disclosure/link/button activation must not submit or advance the study card.
  if(event.key==='Enter'||event.key===' ')event.stopPropagation();
}
</script>

<template>
  <details v-if="lesson" :key="wordId" class="answer-lesson" @keydown="readingKey">
    <summary>完整讲解 · 义项、近反义、词根与助记</summary>
    <div class="answer-lesson-body"><SenseLesson :lesson="lesson" :playback="playback" @play="emit('play',$event)" @cancel-playback="emit('cancel-playback')" /></div>
  </details>
</template>

<style scoped>
.answer-lesson { margin-top: 22px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.answer-lesson > summary { list-style: none; cursor: pointer; position: relative; padding: 15px 24px 15px 0; font-size: 14px; font-weight: 600; color: var(--primary); }
.answer-lesson > summary::-webkit-details-marker { display: none; }
.answer-lesson > summary::after { content: '+'; position: absolute; right: 0; top: 12px; font-size: 20px; font-weight: 400; }
.answer-lesson[open] > summary::after { content: '−'; }
.answer-lesson-body { padding: 10px 0 22px; }
</style>
