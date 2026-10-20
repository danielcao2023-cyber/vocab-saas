<script setup lang="ts">
import {onMounted,onUnmounted,ref} from 'vue';
import {api} from '../api';
import {BOOK_LABELS,type LearningSummary,type WordBook} from '../../../shared/learning';
import type {Streak} from '../types';
import StreakCalendar from '../components/StreakCalendar.vue';
defineProps<{streak?:Streak|null}>();
const emit=defineEmits<{start:[];books:[book:WordBook];updated:[]}>();
const summary=ref<LearningSummary|null>(null),failed=ref(false);let alive=true;
const books:WordBook[]=['mastered','familiar','unfamiliar','new'];
async function load(){failed.value=false;try{const data=await api<LearningSummary>('/api/learning/today');if(alive)summary.value=data;}catch{if(alive)failed.value=true;}}
onMounted(load);onUnmounted(()=>alive=false);
</script>
<template><main class="page learning-home"><div class="grid"><div class="stack"><section v-if="summary" class="panel today"><div class="eyebrow">{{ summary.day }}</div><h1>今天背 <b>{{ summary.total }}</b> 个词</h1><p class="muted">复习 {{ summary.reviewWords }} 个 · 新词 {{ summary.newWords }} 个<span v-if="summary.started"> · 已完成 {{ summary.completed }} 个</span></p><p v-if="summary.deferred" class="note">{{ summary.deferred }} 个词已暂缓，后续继续安排。</p><p v-if="summary.backlog" class="note">还有 {{ summary.backlog }} 个到期词待复习，接下来会优先安排。</p><div class="actions"><button class="btn primary lg" type="button" :disabled="!summary.total" @click="emit('start')">{{ !summary.started?'开始背单词':summary.remaining?'继续背单词':'查看今日结果' }}</button></div></section>
 <section v-else class="panel"><p>{{ failed?'今日任务未能载入。':'正在安排今日任务…' }}</p><button v-if="failed" class="btn" @click="load">重试</button></section>
 <section v-if="summary" class="panel"><h2>我的单词本</h2><div class="book-grid"><button v-for="book in books" :key="book" type="button" @click="emit('books',book)"><span>{{ BOOK_LABELS[book] }}</span><strong>{{ summary.books[book] }}</strong><span aria-hidden="true">›</span></button></div></section>
 </div><StreakCalendar v-if="streak&&summary" :data="streak" :today="summary.day" @updated="emit('updated');load()" @offline="failed=true" /></div></main></template>
<style scoped>
.learning-home .today h1{font-size:32px;margin:10px 0;}.learning-home .today h1 b{color:var(--primary);}.book-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}.book-grid button{display:flex;align-items:center;gap:12px;min-height:70px;border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--surface-2);color:var(--ink);text-align:left;}.book-grid strong{margin-left:auto;color:var(--primary);font-size:22px;}.book-grid button>span:last-child{color:var(--ink-3);font-size:20px;}@media(max-width:400px){.book-grid{grid-template-columns:1fr;}}
</style>
