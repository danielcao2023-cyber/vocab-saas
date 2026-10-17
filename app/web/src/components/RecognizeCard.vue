<script setup lang="ts">
import type { Card } from '../types';
import { COPY } from '../copy';
import MeaningList from '../MeaningList.vue';
import ExplainPanel from './ExplainPanel.vue';
import SpeakButton from './SpeakButton.vue';
defineProps<{ card: Card; revealed: boolean; busy: boolean }>();
defineEmits<{ reveal: []; rate: [rating: number]; play: [] }>();
const ratings=['忘了','模糊','认识','很熟'];
</script>
<template><div class="word"><span>{{ card.headword }}</span><SpeakButton @play="$emit('play')" /></div><div v-if="card.phonetic" class="phon">{{ card.phonetic }}</div><template v-if="!revealed"><p class="think">{{ COPY.think }}</p><button class="btn primary reveal" @click="$emit('reveal')">翻面</button></template><template v-else><div class="revealed"><div class="divider"></div><MeaningList :key="card.id" :meaning="card.meaning_zh" :flag="card.meaning_flag" :source="card.meaning_source" /></div><ExplainPanel :word-id="card.word_id" context="recognize" /><div class="rates sticky"><button v-for="(r,i) in ratings" :key="r" class="rate" :class="`r${i+1}`" :disabled="busy" @click="$emit('rate',i+1)">{{ r }}<small>{{ i+1 }}</small></button></div></template></template>
