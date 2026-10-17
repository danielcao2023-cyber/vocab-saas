<script setup lang="ts">
import { computed } from 'vue';
import { COPY } from '../copy';
import type { Today,Curriculum,Streak,WrongBook } from '../types';
import ProgressPanel from '../components/ProgressPanel.vue';
import StreakCalendar from '../components/StreakCalendar.vue';
const props=defineProps<{today:Today;curriculum:Curriculum;streak:Streak;wrong:WrongBook;empty:boolean}>();
defineEmits<{start:[prefer:'review'|'new'];wrong:[];practice:[];updated:[];offline:[]}>();
const date=computed(()=>new Date(props.today.day+'T00:00:00Z').toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short',timeZone:'UTC'}));
const percent=(n:number|null)=>Math.round((n??0)*100);
</script>
<template><main class="page"><div class="grid"><div class="stack"><section class="panel today"><div class="eyebrow">{{ date }}</div><h1>今天：复习 <b>{{ today.review }}</b> 个 · 新词 <b>{{ today.new }}</b> 个 · 约 <b>{{ today.minutes }}</b> 分钟</h1><p class="note" data-testid="relearn-note">{{ COPY.homeRelearnNote }}</p><p v-if="empty" class="note">{{ COPY.emptyLibrary }}</p><div class="actions"><button class="btn primary lg" :disabled="empty" @click="$emit('start','review')">开始复习</button><button class="btn lg" :disabled="empty" @click="$emit('start','new')">先学新词</button></div><template v-if="today.comparison"><div class="divider"></div><p class="note">{{ COPY.comparison(today.comparison.thisWeek.masteredNew-today.comparison.previousWeek.masteredNew,percent(today.comparison.thisWeek.accuracy),percent(today.comparison.previousWeek.accuracy)) }}</p></template></section><ProgressPanel :curriculum="curriculum" /><section class="panel"><h2>错词本</h2><p>{{ COPY.wrongSummary(wrong.total,wrong.practicedTwiceThisWeek) }}</p><button v-if="wrong.total" class="btn" @click="$emit('practice')">{{ COPY.practice(Math.min(10,wrong.total)) }}</button><p v-else class="small muted">{{ COPY.wrongEmptyNote }}</p></section></div><StreakCalendar :data="streak" :today="today.day" @updated="$emit('updated')" @offline="$emit('offline')" /></div></main></template>
