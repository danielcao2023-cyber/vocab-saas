<script setup lang="ts">
import { computed } from 'vue';
import type { Card, Question, ChoiceResult } from '../types';
import { COPY } from '../copy';
import { maskAnswer } from '../../../server/src/text';
import MeaningList from '../MeaningList.vue';
import SpeakButton from './SpeakButton.vue';
const props=defineProps<{ card: Card; question: Question; result: ChoiceResult | null; busy: boolean }>();
defineEmits<{ choose: [wordId: number]; next: []; play: [] }>();
const letter=computed(()=>props.result ? String.fromCharCode(65+props.question.options.findIndex(o=>o.wordId===props.result!.answerWordId)):'');
// 作答前把释义/选项里出现的答案词头（如“一会儿（for a while）”）遮成“～”，词形说明里的原形遮成“某词”；服务端出题时也做同样处理
function mask(text:string|null){if(!text||props.result)return text??'';return maskAnswer(text,props.card.headword);}
const firstMeaning=computed(()=>(props.result?.expected.meaning_zh??'').split('\n')[0].replace(/^\s*[a-z]+\.\s*/i,'').split(/[,，;；]/)[0]);
</script>
<template>
  <div v-if="question.qtype==='listen_choice'" class="listen"><SpeakButton large @play="$emit('play')" /><div><div class="wave" aria-hidden="true"><i v-for="(h,i) in [10,18,26,14,22,30,16,24,12,20,28,14,8]" :key="i" :style="{height:`${h}px`}"></i></div><div class="small muted">{{ COPY.listenHint }}</div></div></div>
  <div class="prompt"><div class="q">{{ question.qtype==='listen_choice'?COPY.listenPrompt:COPY.meaningPrompt }}</div><MeaningList v-if="question.qtype==='meaning_choice'" :key="question.id" :meaning="mask(card.meaning_zh)" :flag="card.meaning_flag" :source="card.meaning_source" /></div>
  <div class="opts"><button v-for="(o,i) in question.options" :key="o.wordId" class="opt" :class="{en:question.qtype==='meaning_choice',right:result&&o.wordId===result.answerWordId,wrong:result&&!result.correct&&o.wordId===result.chosenWordId,dim:result&&o.wordId!==result.answerWordId&&o.wordId!==result.chosenWordId}" :disabled="busy||!!result" @click="$emit('choose',o.wordId)"><span class="k">{{ String.fromCharCode(65+i) }}<small>{{ i+1 }}</small></span><span class="text">{{ question.qtype==='listen_choice'?mask(o.text):o.text }}</span><span v-if="result&&o.wordId===result.answerWordId" class="mark">✓</span><span v-else-if="result&&o.wordId===result.chosenWordId" class="mark">{{ COPY.chosen }}</span></button></div>
  <div v-if="result" class="fb" :class="result.correct?'ok':'bad'" role="status"><div><template v-if="result.correct"><div class="t">{{ COPY.correct }}</div><div class="d"><i>{{ result.expected.headword }}</i> <span v-if="result.expected.phonetic">{{ result.expected.phonetic }}</span> {{ firstMeaning }}</div></template><template v-else><div class="t">{{ COPY.expectedChoice(letter,result.expected.headword,firstMeaning) }}</div><div class="d small">{{ COPY.chosen }} {{ result.chosen.headword }}：{{ result.chosen.meaning_first_line }}</div></template></div></div>
  <p v-if="question.qtype==='listen_choice'&&!result" class="small muted">{{ COPY.audioHelp }}</p>
  <div v-if="result" class="after"><SpeakButton @play="$emit('play')" /><button class="btn primary" :disabled="busy" @click="$emit('next')">{{ COPY.next }}</button></div>
</template>
