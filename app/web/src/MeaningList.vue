<script setup lang="ts">
import { computed, ref } from 'vue';
import { splitSenses, toggleLabel } from './senses';
const props = defineProps<{ meaning: string | null; flag?: string | null; source?: string | null }>();
function parts(sense: string) { const match = sense.match(/^([a-z]+\.)\s*(.*)$/i);return match ? {pos:match[1],text:match[2]} : {pos:'',text:sense}; }
const open = ref(false);
const s = computed(() => splitSenses(props.meaning, props.source === 'manual' ? Infinity : 2));
</script>

<template>
  <div class="meaning">
    <div v-for="(m, i) in s.shown" :key="i" class="sense" :aria-label="m"><span v-if="parts(m).pos" class="pos">{{ parts(m).pos }}</span>{{ parts(m).text }}</div>
    <div v-if="!s.shown.length">（暂无释义）</div>
    <p v-if="flag" class="warn small">{{ flag }}</p>
    <template v-if="s.more.length">
      <button type="button" class="link" @click="open = !open">{{ toggleLabel(open, s.more.length) }}</button>
      <div v-if="open" class="more"><div v-for="(m, i) in s.more" :key="i" class="sense" :aria-label="m"><span v-if="parts(m).pos" class="pos">{{ parts(m).pos }}</span>{{ parts(m).text }}</div></div>
    </template>
  </div>
</template>
