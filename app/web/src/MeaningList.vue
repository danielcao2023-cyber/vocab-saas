<script setup lang="ts">
import { computed, ref } from 'vue';
import { splitSenses, toggleLabel } from './senses';
const props = defineProps<{ meaning: string | null; flag?: string | null }>();
const open = ref(false);
const s = computed(() => splitSenses(props.meaning));
</script>

<template>
  <div class="meaning">
    <div v-for="(m, i) in s.shown" :key="i" class="sense">{{ m }}</div>
    <div v-if="!s.shown.length">（暂无释义）</div>
    <p v-if="flag" class="warn small">{{ flag }}</p>
    <template v-if="s.more.length">
      <button type="button" class="link" @click="open = !open">{{ toggleLabel(open, s.more.length) }}</button>
      <div v-if="open" class="more"><div v-for="(m, i) in s.more" :key="i" class="sense">{{ m }}</div></div>
    </template>
  </div>
</template>
