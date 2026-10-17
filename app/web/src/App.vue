<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api, ClientError, OfflineError } from './api';
import { COPY } from './copy';
import type { Today, Streak, Curriculum, Turn, WrongBook } from './types';
import HomeView from './views/HomeView.vue';
import StudyView from './views/StudyView.vue';
import WrongView from './views/WrongView.vue';
import DoneView from './views/DoneView.vue';
import ParentView from './views/ParentView.vue';
import ProgressPanel from './components/ProgressPanel.vue';
import './styles/tokens.css';
import './styles/app.css';
const isParent=location.pathname.replace(/\/$/,'')==='/parent';
type View='home'|'study'|'wrong'|'progress'|'done';
const view=ref<View>('home'),online=ref(true),stale=ref(false),busy=ref(false);
const today=ref<Today|null>(null),calendar=ref<Streak|null>(null),curriculum=ref<Curriculum|null>(null),lists=ref<any[]>([]);
const wrong=ref<WrongBook>({items:[],total:0,twoCorrectDays:0}),sort=ref<'count'|'recent'>('count');
const prefer=ref<'review'|'new'>('review'),practice=ref<Turn[]|null>(null),estimate=ref(0),session=ref({done:0,correct:0});
const isSample=computed(()=>lists.value.some(l=>l.isSample));
const empty=computed(()=>!lists.value.some(l=>l.total));
function reloadPage() { location.reload(); }
async function guard<T>(fn:()=>Promise<T>){try{const result=await fn();online.value=true;return result;}catch(e){if(e instanceof OfflineError)online.value=false;else if(e instanceof ClientError)stale.value=true;else throw e;}}
async function loadHome(){
  await guard(async()=>{const [t,p,w,s]=await Promise.all([api<Today>('/api/today'),api('/api/progress'),api<WrongBook>('/api/wrong?sort='+sort.value),api<Streak>('/api/streak')]);today.value=t;lists.value=p.lists;curriculum.value=p.curriculum;wrong.value=w;calendar.value=s;});
}
async function ping(){try{online.value=(await fetch('/health')).ok;}catch{online.value=false;}}
function go(v:View){view.value=v;loadHome();}
function start(p:'review'|'new'){if(busy.value||!today.value)return;prefer.value=p;practice.value=null;estimate.value=today.value.review+today.value.new;session.value={done:0,correct:0};view.value='study';}
async function startPractice(){
  if(busy.value)return;busy.value=true;
  try{const r=await guard(()=>api<{items:Turn[]}>('/api/wrong/practice?sort='+sort.value));if(!r)return;practice.value=r.items;estimate.value=r.items.length;session.value={done:0,correct:0};view.value='study';}finally{busy.value=false;}
}
async function changeSort(value:'count'|'recent'){if(busy.value)return;sort.value=value;busy.value=true;try{const r=await guard(()=>api<WrongBook>('/api/wrong?sort='+value));if(r)wrong.value=r;}finally{busy.value=false;}}
async function remove(id:number){if(busy.value)return;busy.value=true;try{await guard(()=>api('/api/wrong/'+id,{inBook:false}));await loadHome();}finally{busy.value=false;}}
async function done(value:{done:number;correct:number}){session.value=value;view.value='done';await loadHome();}
let timer:number|undefined;
onMounted(()=>{if(isParent)return;loadHome();timer=window.setInterval(ping,30000);window.addEventListener('online',ping);});
onUnmounted(()=>{clearInterval(timer);window.removeEventListener('online',ping);});
const tabs=[{view:'home' as const,label:'今日'},{view:'wrong' as const,label:'错词本'},{view:'progress' as const,label:'进度'}];
</script>
<template>
<ParentView v-if="isParent" />
<template v-else>
  <header v-if="view!=='study'" class="top"><div class="in"><div class="brand"><span class="logo">W</span>背单词</div><nav class="tabs" aria-label="主导航"><button v-for="tab in tabs" :key="tab.view" :class="{on:view===tab.view}" :aria-current="view===tab.view?'page':undefined" @click="go(tab.view)">{{ tab.label }}</button></nav><div class="right"><span class="chip streak"><span class="flame"></span>{{ COPY.continuous(today?.streak??0) }}</span></div></div></header>
  <div class="banners"><div v-if="!online" class="offline" role="alert">连不上学习服务。如果不在家，请先打开 Tailscale；在家的话请家长看一下 Studio 是否开机。 <button @click="ping(); loadHome()">重试</button></div><div v-if="stale" class="offline" role="alert" data-testid="stale">{{ COPY.staleCard }} <button @click="reloadPage">{{ COPY.refresh }}</button></div><div v-if="isSample" class="sample">当前是示例数据（开发测试用），不是课标词表。</div></div>
  <HomeView v-if="view==='home'&&today&&curriculum&&calendar" :today="today" :curriculum="curriculum" :streak="calendar" :wrong="wrong" :empty="empty" @start="start" @wrong="go('wrong')" @practice="startPractice" @updated="loadHome" @offline="online=false" />
  <StudyView v-if="view==='study'" :prefer="prefer" :practice="practice" :estimate="estimate" @cancel="go('home')" @done="done" @online="online=$event" @stale="stale=true" />
  <WrongView v-if="view==='wrong'&&today" :wrong="wrong" :sort="sort" :today="today.day" :busy="busy" @sort="changeSort" @practice="startPractice" @remove="remove" @home="go('home')" />
  <DoneView v-if="view==='done'&&today" :today="today" :session="session" @home="go('home')" @practice="startPractice" />
  <main v-if="view==='progress'&&curriculum" class="page"><h1>进度（按词表）</h1><ProgressPanel :curriculum="curriculum" /><section v-for="l in lists.filter(l=>l.source!=='kb2022')" :key="l.source" class="panel" style="margin-top:20px"><h2>{{ l.source }}<span v-if="l.isSample">（示例数据）</span>：已掌握 {{ l.mastered }}/{{ l.total }}</h2><div class="bar"><span class="m" :style="{flex:l.mastered}"></span><span class="f" :style="{flex:l.familiar}"></span><span class="l" :style="{flex:l.learning}"></span><span :style="{flex:l.new}"></span></div><p class="muted">掌握 {{ l.mastered }} · 熟悉 {{ l.familiar }} · 学习中 {{ l.learning }} · 新词 {{ l.new }}</p></section></main>
  <nav v-if="view!=='study'" class="bottombar" aria-label="手机导航"><button v-for="tab in tabs" :key="tab.view" :class="{on:view===tab.view}" :aria-current="view===tab.view?'page':undefined" @click="go(tab.view)"><i aria-hidden="true"></i>{{ tab.label }}</button></nav>
</template>
</template>
