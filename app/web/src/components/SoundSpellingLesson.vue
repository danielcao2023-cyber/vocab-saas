<script setup lang="ts">
import {computed, onUnmounted, ref, watch} from 'vue';
import {api} from '../api';
import type {SoundSpellingLesson} from '../content/sound-spelling/types';
const props=defineProps<{lesson:SoundSpellingLesson;recordingWord?:string}>();
const recordingNote=ref('');
let recordingRequest=0;
watch(()=>props.recordingWord??props.lesson.headword,async word=>{
 const request=++recordingRequest;recordingNote.value='';
 try{
  const info=await api<{status:string;accent?:string;pronunciationNote?:string}>(`/api/pronunciation?word=${encodeURIComponent(word)}`);
  if(request!==recordingRequest||info.status!=='ready')return;
  recordingNote.value=[info.accent==='uk'?'英式录音':info.accent==='us'?'美式录音':'整词录音',info.pronunciationNote].filter(Boolean).join(' · ');
 }catch{/* Optional metadata never blocks the spelling map or playback. */}
},{immediate:true});
onUnmounted(()=>{recordingRequest++;});
const stressLabels={primary:'重读',secondary:'次重音',none:'轻读'};
const selectedChunk=computed(()=>props.lesson.chunks[selected.value]??props.lesson.chunks[0]);
defineEmits<{play:[]}>();
const selected=ref(0);
watch(()=>props.lesson.headword,()=>{selected.value=0;});
</script>
<template><div class="sound-spelling">
 <div class="sound-heading"><div><p class="eyebrow">把听到的声音，变成写得出的单词</p><h3>先听，再分段记住</h3><p class="sound-ipa">{{ lesson.ipa }}</p></div><button class="btn sound-play" type="button" @click="$emit('play')"><span aria-hidden="true">▶</span> 听整词录音</button></div>
 <p v-if="recordingNote" class="small muted" aria-label="当前整词录音说明">{{ recordingNote }}</p>
 <div class="sound-chunks" aria-label="读音与字母对应"><button v-for="(chunk,i) in lesson.chunks" :key="i" class="sound-chunk" :class="{selected:selected===i,strong:chunk.stress==='primary'}" type="button" :aria-pressed="selected===i" @click="selected=i"><span class="chunk-stress">{{ chunk.crossesStressBoundary ? '跨重音' : stressLabels[chunk.stress] }}</span><span class="chunk-letters">{{ chunk.letters }}</span><span class="chunk-sound">{{ chunk.sound }}</span><span class="chunk-hint">{{ chunk.hint }}</span><span class="sound-pairs"><span v-for="(pair,j) in chunk.pairs" :key="j" class="sound-pair"><b>{{ pair.letters }}</b><span>{{ pair.sound || '不单独发音' }}</span></span></span></button></div>
 <div class="sound-tip" role="status" aria-live="polite"><strong>{{ selectedChunk.letters }}：怎么从声音想到字母</strong><p>{{ selectedChunk.tip }}</p></div>
 <section class="spelling-anchor"><h4>拼写时记住这一点</h4><p><span class="spelling-word"><template v-if="lesson.anchor.parts"><template v-for="(part,i) in lesson.anchor.parts" :key="i"><b v-if="part.emphasis">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></template><template v-else>{{ recordingWord || lesson.headword }}</template></span><span>{{ lesson.anchor.text }}</span></p><p v-if="lesson.anchor.formation" class="small muted">还可以用词形帮忙：<span class="word-piece">{{ lesson.anchor.formation }}</span></p></section>
 <p class="sound-footnote small muted">分段帮助你把声音和拼写对应起来，不等于严格的音节或词根划分；字母组合可以整体对应一个或多个音。点击分段查看提醒，播放按钮播放整词录音，录音的口音、连读或弱化可能与对照音标不同；有变读的词请同时查看下方提醒。</p>
 <details v-if="lesson.uk || lesson.variantNote" class="sound-variants"><summary>其他读法与拼写提醒</summary><p v-if="lesson.uk" class="sound-ipa">英式 {{ lesson.uk }}</p><p v-if="lesson.variantNote">{{ lesson.variantNote }}</p></details>
 <p class="sound-sources small muted">读音核对：<template v-for="(source,i) in lesson.sources" :key="source.url"><span v-if="i"> · </span><a :href="source.url" class="link" target="_blank" rel="noopener noreferrer">{{ source.label }}</a></template></p>
</div></template>
<style scoped>
.sound-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:6px 0 22px;}.sound-heading .eyebrow{margin:0 0 6px;font-size:12px;}.sound-heading h3{font-size:23px;margin:0 0 8px;}.sound-ipa{font-size:19px;color:var(--ink-2);margin:8px 0 0;}.sound-play{flex-shrink:0;background:var(--primary-soft);color:var(--primary);border-color:transparent;}.sound-play span{font-size:12px;margin-right:5px;}
.sound-chunks{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;}.sound-chunk{min-width:0;display:flex;align-items:center;flex-direction:column;text-align:center;border:1px solid var(--line);border-radius:16px;padding:16px 10px;background:var(--surface);color:var(--ink);}.sound-chunk.selected{border-color:var(--primary);background:var(--primary-soft);}.chunk-stress{font-size:11px;color:var(--ink-2);background:var(--surface-2);border-radius:6px;padding:3px 9px;}.strong .chunk-stress{color:var(--primary);background:var(--primary-soft);}.chunk-letters{font:500 36px/1.2 var(--font-word);margin-top:13px;letter-spacing:1px;}.strong .chunk-letters{color:var(--primary);}.chunk-sound{font-size:19px;margin-top:8px;color:var(--ink-2);}.chunk-hint{font-size:11px;color:var(--ink-2);margin:12px 0 16px;}.sound-pairs{display:flex;justify-content:center;flex-wrap:wrap;gap:5px;width:100%;border-top:1px solid var(--line);padding-top:12px;}.sound-pair{display:flex;flex:1;min-width:25px;align-items:center;flex-direction:column;gap:5px;font-size:13px;}.sound-pair b{font:500 20px/1.3 var(--font-word);}.sound-pair>span{color:var(--ink-2);}
.sound-tip{border-left:3px solid var(--primary);background:var(--surface-2);padding:14px 16px;margin-top:16px;border-radius:0 10px 10px 0;font-size:14px;}.sound-tip strong{font-weight:600;}.sound-tip p{margin:7px 0 0;line-height:1.8;}.spelling-anchor{margin-top:24px;}.spelling-anchor h4{font-size:16px;margin:0 0 12px;}.spelling-anchor p{display:flex;align-items:center;gap:12px 20px;flex-wrap:wrap;margin:10px 0;font-size:14px;line-height:1.8;}.spelling-word{font:28px/1.4 var(--font-word);letter-spacing:1px;}.spelling-word b{color:var(--primary);text-decoration:underline;text-underline-offset:6px;}.word-piece{font-family:var(--font-word);}.sound-variants{margin-top:22px;border-top:1px solid var(--line);padding-top:14px;}.sound-variants summary{font-size:13px;color:var(--ink-2);cursor:pointer;}.sound-variants p{line-height:1.8;font-size:14px;}.sound-variants .sound-ipa{font-size:18px;}.sound-footnote{margin:18px 0 0;line-height:1.8;}.sound-sources{margin:18px 0 0;font-size:11px;line-height:1.9;}
@media(max-width:640px){.sound-heading{align-items:flex-start;flex-direction:column;gap:10px;}.sound-heading h3{font-size:21px;}.sound-chunks{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}.sound-chunk{padding:12px 5px;border-radius:12px;}.chunk-letters{font-size:29px;letter-spacing:0;}.chunk-sound{font-size:16px;}.chunk-hint{min-height:32px;font-size:10px;line-height:1.6;margin:10px 0;}.sound-pairs{gap:2px;}.sound-pair{min-width:21px;font-size:11px;}.sound-pair b{font-size:18px;}.sound-tip{padding:12px;font-size:13px;}}
</style>
