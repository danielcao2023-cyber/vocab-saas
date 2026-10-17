<script setup lang="ts">
import { computed } from 'vue';
import { COPY } from '../copy';
import type { Today } from '../types';
const props=defineProps<{today:Today;session:{done:number;correct:number}}>();
const nextBadge=computed(()=>[7,30,100].find(days=>days>props.today.streak));
defineEmits<{home:[];practice:[]}>();
</script>
<template><main class="page done-page"><section class="panel empty"><svg viewBox="0 0 120 96" fill="none" aria-hidden="true"><circle cx="60" cy="48" r="38" fill="var(--amber-soft)"/><circle cx="60" cy="48" r="26" fill="var(--amber)"/><path d="m48 48 8 8 16-17" stroke="var(--surface)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg><h2>{{ today.completed?COPY.complete:COPY.roundDone }}</h2><p>{{ COPY.doneSummary(today.stats.answers,Math.round((today.stats.accuracy??0)*100),today.masteredNew,today.tomorrowReview) }}</p><p v-if="!today.completed" class="note">{{ COPY.roundSummary(session.done,session.done?Math.round(session.correct/session.done*100):0) }}</p><div v-if="today.completed" class="badges"><div class="badge got"><b>{{ today.streak }} 天</b>连续打卡</div><div v-if="nextBadge" class="badge"><b>{{ nextBadge }} 天</b>{{ COPY.remainingDays(nextBadge-today.streak) }}</div></div><div class="actions"><button class="btn primary" @click="$emit('home')">回首页</button><button class="btn" @click="$emit('practice')">再练错词</button></div></section></main></template>
