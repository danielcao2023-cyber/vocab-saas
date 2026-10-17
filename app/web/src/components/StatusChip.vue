<script setup lang="ts">
import type {LearningStatus} from '../types';
defineProps<{status:LearningStatus}>();
const classes={'新词':'new','学习中':'learning','熟悉':'familiar','掌握':'mastered'};
</script>
<template><span class="st" :class="classes[status]">{{ status }}</span></template>
