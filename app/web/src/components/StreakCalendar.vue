<script setup lang="ts">
import { computed, ref } from 'vue';
import { api, ClientError, OfflineError } from '../api';
import type { Streak } from '../types';
import { COPY } from '../copy';
const props=defineProps<{ data: Streak; today: string }>();
const emit=defineEmits<{ updated: []; offline: [] }>();
const selected=ref<Streak|null>(null), month=ref(props.today.slice(0,7)),busy=ref(false),error=ref('');
const data=computed(()=>selected.value??props.data);
const blanks=computed(()=>{const day=new Date(month.value+'-01T00:00:00Z').getUTCDay();return (day+6)%7;});
async function move(delta:number){
  if(busy.value)return;busy.value=true;error.value='';
  const d=new Date(month.value+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);const m=d.toISOString().slice(0,7);
  try{selected.value=await api('/api/streak?month='+m);month.value=m;}catch(e){if(e instanceof OfflineError)emit('offline');else if(e instanceof ClientError)error.value=e.message;else throw e;}finally{busy.value=false;}
}
const blocked=(day:string)=>data.value.makeupBlocked?.[day]??'';
// 补签提示随状态变化：今天没完成 / 完成了且还能补 / 完成了但没有可补的日子 / 本月次数用完
const hint=computed(()=>data.value.makeupLeft<=0?COPY.makeupUsedUp:data.value.todayDone===false?COPY.makeupHint:data.value.makeupCandidates.length?COPY.makeupReady:COPY.makeupNoneEligible);
function pick(day:string){if(data.value.makeupCandidates.includes(day))makeup(day);else if(blocked(day))error.value=`${Number(day.slice(5,7))}月${Number(day.slice(8,10))}日：${blocked(day)}。`;}
async function makeup(day:string){
  if(busy.value)return;busy.value=true;error.value='';
  try{selected.value=await api('/api/streak/makeup',{day});emit('updated');}catch(e){if(e instanceof OfflineError)emit('offline');else if(e instanceof ClientError)error.value=e.message;else throw e;}finally{busy.value=false;}
}
const labels: Record<string,string>={done:COPY.calendarDone,makeup:COPY.calendarMakeup,today:COPY.calendarToday,missed:COPY.missed,future:COPY.future,before_start:COPY.beforeStart};
</script>
<template><section class="panel"><h2>{{ COPY.checkin }}</h2><div class="cal-head"><span class="big"><i class="flame"></i> {{ COPY.continuous(data.current) }}</span><span class="small muted">{{ COPY.makeupLeft(data.makeupLeft) }}</span></div><div class="month-nav"><button aria-label="上个月" :disabled="busy" @click="move(-1)">‹</button><span>{{ month.replace('-',' 年 ') }} 月</span><button aria-label="下个月" :disabled="busy||month>=today.slice(0,7)" @click="move(1)">›</button></div>
<div class="cal"><span v-for="d in ['一','二','三','四','五','六','日']" :key="d" class="dow">{{ d }}</span><span v-for="n in blanks" :key="`blank${n}`" class="d blank"></span><button v-for="d in data.calendar" :key="d.day" class="d" :class="[d.status,{'can-makeup':data.makeupCandidates.includes(d.day),'is-today':d.day===today}]" :disabled="busy||!(data.makeupCandidates.includes(d.day)||blocked(d.day))" :title="`${d.day} ${labels[d.status]}${data.makeupCandidates.includes(d.day)?' · 点击补签':''}`" :aria-label="`${d.day} ${labels[d.status]}${data.makeupCandidates.includes(d.day)?'，补签':''}`" @click="pick(d.day)">{{ Number(d.day.slice(-2)) }}</button></div>
<div class="legend"><span>{{ COPY.calendarDone }} ●</span><span>{{ COPY.calendarMakeup }} ▨</span><span>{{ COPY.calendarToday }} ◯</span></div><p class="note" data-testid="makeup-hint">{{ hint }}</p><p v-if="error" class="retry" role="status">{{ error }}</p>
<div class="badges"><div v-for="b in data.badges" :key="b.days" class="badge" :class="{got:b.earned}"><b>{{ b.days }} 天</b><span>{{ b.earned?COPY.earned:`${b.progress} / ${b.days}` }}</span><div v-if="!b.earned" class="mini"><span :style="{width:`${b.progress/b.days*100}%`}"></span></div></div></div></section></template>
