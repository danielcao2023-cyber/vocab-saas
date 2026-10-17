<script setup lang="ts">
defineProps<{ large?: boolean }>();
defineEmits<{ play: [] }>();
</script>
<template><button type="button" :class="large ? 'play' : 'speak'" title="听发音（R / 空格）" aria-label="听发音" @click="$emit('play')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg></button></template>
