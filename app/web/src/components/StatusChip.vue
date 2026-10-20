<script setup lang="ts">
import type {LearningStatus} from '../types';
defineProps<{status:LearningStatus}>();
const labels={'新词':'生词','学习中':'不熟','掌握':'已掌握'};
const classes={'新词':'new','学习中':'learning','熟悉':'familiar','掌握':'mastered','生词':'new','不熟':'learning','已掌握':'mastered'};
</script>
<template><span class="st" :class="classes[status]">{{ labels[status as keyof typeof labels]??status }}</span></template>
