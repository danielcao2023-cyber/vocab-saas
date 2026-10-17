<script setup lang="ts">
import { COPY } from '../copy';
import type { Curriculum } from '../types';
defineProps<{ curriculum: Curriculum }>();
const groups = [{key:'core' as const,label:COPY.core,note:COPY.coreNote},{key:'level2' as const,label:COPY.level2,note:COPY.level2Note}];
</script>
<template><section class="panel"><h2>{{ COPY.curriculumProgress }}</h2><div v-for="g in groups" :key="g.key" class="prog"><div class="row"><span><span class="tag" :class="{core:g.key==='core'}">{{ g.label }}</span> {{ g.note }}</span><span class="num"><b>{{ curriculum[g.key].mastered }}</b> / {{ curriculum[g.key].total }} 已掌握</span></div><div class="bar" :aria-label="`${g.label}已掌握 ${curriculum[g.key].mastered} / ${curriculum[g.key].total}`"><span class="m" :style="{flex:curriculum[g.key].mastered}"></span><span class="f" :style="{flex:curriculum[g.key].familiar}"></span><span class="l" :style="{flex:curriculum[g.key].learning}"></span><span :style="{flex:curriculum[g.key].new}"></span></div></div><div class="progress-legend"><span v-for="(label,key) in {mastered:'掌握',familiar:'熟悉',learning:'学习中',new:'还没学'}" :key="key"><i :class="key"></i>{{ label }}</span></div></section></template>
