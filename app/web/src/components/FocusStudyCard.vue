<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import type {LearningCard,LearningResult,LearningResultV3} from '../../../shared/learning';
import type {PlaybackFailure} from '../api';
import LetterSlots from './LetterSlots.vue';
import MeaningList from '../MeaningList.vue';
import SpeakButton from './SpeakButton.vue';
import {hasDictionaryPlaceholder} from '../../../server/src/text';
const props=defineProps<{card:LearningCard;answer:string;feedback:LearningResult&Partial<LearningResultV3>|null;busy:boolean;audioFailed:PlaybackFailure|null}>();
const emit=defineEmits<{'update:answer':[value:string];choose:[id:number];submit:[];next:[];play:[];learn:[];defer:[]}>();
const pattern=ref(props.card.patterns[0]??'');watch(()=>props.card.issueId,()=>pattern.value=props.card.patterns[0]??'');
const canSubmit=computed(()=>props.answer.trim().length>0&&!props.busy);
const placeholderHint=computed(()=>{
 if(props.card.mode!=='recognize')return '';
 const word=props.card.headword??'',hints:string[]=[];
 if(/\bsb\./i.test(word))hints.push('sb. 表示某人');
 if(/\bsth\./i.test(word))hints.push('sth. 表示某事或某物');
 if(/\.{3}|…/.test(word))hints.push('省略号表示可替换的内容');
 return hints.join('；');
});
const titles={recognize:'英译汉',spell:'汉译英',dictation:'听写'};
function setPattern(value:string){pattern.value=value;emit('update:answer','');}
</script>
<template><article class="focus-card"><div class="focus-toolbar"><span class="small muted">{{ titles[card.mode] }}</span><button class="learn-word" type="button" :disabled="busy" @click="emit('learn')">学习该词 <span aria-hidden="true">↗</span></button></div>
 <div class="focus-question"><h1 v-if="card.mode==='recognize'" class="headword">{{ card.headword }}</h1><div v-else-if="card.mode==='spell'" class="meaning"><MeaningList :meaning="card.meaning??''" :source="card.meaning_source" /></div><SpeakButton v-else large @play="emit('play')" /></div>
 <p v-if="card.mode==='spell'&&card.promptHint" class="assessment-note">{{ card.promptHint }}</p>
 <p v-if="placeholderHint" class="assessment-note">{{ placeholderHint }}。</p>
 <p v-if="card.mode==='recognize'&&hasDictionaryPlaceholder(card.headword??'')" class="assessment-note">本词条仅评估认词，暂不测拼写和听写。</p>
 <div v-if="card.mode==='recognize'" class="focus-options"><button v-for="(option,i) in card.options" :key="option.id" type="button" :class="{forgot:option.id===0}" :disabled="busy||!!feedback" @click="emit('choose',option.id)"><span>{{ option.id===0?'':String.fromCharCode(65+i) }}</span>{{ option.text }}</button></div>
 <template v-else>
  <div v-if="card.patterns.length>1&&!feedback" class="patterns" aria-label="可用拼写长度"><button v-for="p in card.patterns" :key="p" type="button" :disabled="busy" :aria-pressed="pattern===p" @click="setPattern(p)">{{ [...p].filter(c=>c==='_').length }} 个字母</button></div>
  <LetterSlots :pattern="pattern" :model-value="answer" :disabled="busy||!!feedback" @update:model-value="emit('update:answer',$event)" @submit="emit('submit')" />
  <div v-if="!feedback" class="focus-confirm"><button class="btn primary" type="button" :disabled="!canSubmit||[...pattern].filter(c=>c==='_').length!==answer.replace(/[^A-Za-z]/g,'').length" @click="emit('submit')">确认答案</button></div>
 </template>

 <div v-if="feedback" class="focus-feedback" :class="(feedback.independentlyRecalled??(feedback.correct&&!feedback.assisted))?'correct':'review'" role="status"><div><strong>{{ feedback.evidenceKind==='correction'?'这次记住了，稍后再独立试试':feedback.correct&&!feedback.assisted?'答对了 👍':'再看一眼' }}</strong><p v-if="!feedback.correct">{{ feedback.expected }} · {{ feedback.meaning }}</p></div><button class="btn primary" type="button" :disabled="busy" @click="emit('next')">继续</button></div>
 <div v-if="audioFailed" class="note" role="status">{{ audioFailed==='blocked'?'请点击播放按钮启用读音。':'这个读音暂时无法播放，请确认设备已安装英文语音。' }} <button class="link" type="button" @click="emit('play')">重试播放</button><button v-if="audioFailed!=='blocked'&&!feedback" class="link" type="button" :disabled="busy" @click="emit('defer')">暂缓此词</button></div>
</article></template>
<style scoped>
.focus-card{max-width:720px;margin:0 auto;background:var(--surface);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow);padding:20px 28px 30px;min-width:0;}
.assessment-note{margin:0 0 16px;text-align:center;color:var(--ink-2);font-size:14px;line-height:1.5;}
.focus-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;}.learn-word{min-height:44px;border:0;padding:9px 14px;border-radius:10px;background:var(--primary-soft);color:var(--primary);font-size:13px;}
.focus-question{min-height:190px;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px 0;}.headword{font:500 64px/1.15 var(--font-word);margin:0;overflow-wrap:anywhere;}.meaning{font-size:24px;text-align:left;max-width:100%;overflow-wrap:anywhere;}.meaning :deep(.meaning){font-size:24px;}
.focus-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;}.focus-options button{min-height:56px;text-align:left;padding:12px 16px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);overflow-wrap:anywhere;}.focus-options button span{font-size:12px;color:var(--ink-3);margin-right:14px;}.focus-options button.forgot{grid-column:1/-1;text-align:center;border-color:transparent;background:var(--surface-2);color:var(--ink-2);min-height:44px;}
.focus-confirm{display:flex;justify-content:center;}
.focus-feedback{margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:12px;background:var(--warn-soft);color:var(--warn);}.focus-feedback.correct{background:var(--ok-soft);color:var(--ok);}.focus-feedback p{margin:5px 0 0;overflow-wrap:anywhere;}.focus-feedback .btn{flex-shrink:0;}.patterns{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;}.patterns button{min-height:36px;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:8px;padding:5px 9px;font-size:12px;}.patterns button[aria-pressed=true]{background:var(--primary-soft);color:var(--primary);}.note .link{margin-left:10px;}
@media(max-width:640px){.focus-card{padding:16px 18px 24px;border-radius:20px;}.focus-question{min-height:170px;}.headword{font-size:50px;}.meaning{font-size:21px;}.focus-options{grid-template-columns:1fr;gap:10px;}.focus-feedback{flex-wrap:wrap;}}
</style>
