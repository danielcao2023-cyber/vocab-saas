<script setup lang="ts">
import {computed,nextTick,onMounted,onUnmounted,ref} from 'vue';
import {api} from './api';
import {LessonNavigation} from './lesson-navigation';
import {COPY} from './copy';
import type {Streak,Curriculum} from './types';
import type {LearningView} from '../../shared/learning';
import LearningHomeView from './views/LearningHomeView.vue';
import LearningStudyView from './views/LearningStudyView.vue';
import WordBooksView from './views/WordBooksView.vue';
import ParentView from './views/ParentView.vue';
import SearchBox from './components/SearchBox.vue';
import BrowseView from './views/BrowseView.vue';
import WordView from './views/WordView.vue';
import ProgressPanel from './components/ProgressPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import {applyPreferences,preferenceRevision} from './preferences';
import type {PreferencesResponse} from '../../shared/preferences';
import './styles/tokens.css';
import './styles/app.css';
const isParent=location.pathname.replace(/\/$/,'')==='/parent';
type View='home'|'study'|'books'|'progress'|'browse'|'word';
const view=ref<View>('home'),previousView=ref<View>('home'),wordId=ref<number|null>(null),searchOpen=ref(false),online=ref(true);
const calendar=ref<Streak|null>(null),curriculum=ref<Curriculum|null>(null),lists=ref<any[]>([]),book=ref<LearningView>('all');
const navigation=new LessonNavigation(body=>api('/api/learning/exposure',body));
const navigationError=ref(false),navigating=ref(false);
const settingsOpen=ref(false);
function closeSettings(){settingsOpen.value=false;void nextTick(()=>document.querySelector<HTMLButtonElement>('.settings-button')?.focus());}
function openSettings(){if(!navigationError.value&&!navigating.value)settingsOpen.value=true;}
async function loadPreferences(){const revision=preferenceRevision(),result=await api<PreferencesResponse>('/api/settings');if(!result?.preferences)throw Error('Settings unavailable');if(preferenceRevision()===revision)applyPreferences(result.preferences);}
async function navigate(commit:()=>void,enterWordId?:number){if(navigating.value||navigationError.value)return;navigating.value=true;navigationError.value=!await navigation.run({exitWordId:view.value==='word'?wordId.value??undefined:undefined,enterWordId,commit});navigating.value=false;}
async function retryNavigation(){navigating.value=true;navigationError.value=!await navigation.retry();navigating.value=false;}
let alive=true,wordHistory=false,timer:ReturnType<typeof setInterval>|undefined,version=0;
const isSample=computed(()=>lists.value.some(l=>l.isSample));
const activeTab=computed(()=>view.value==='word'?previousView.value:view.value);
const keepStudy=computed(()=>view.value==='study'||(view.value==='word'&&previousView.value==='study'));
async function loadHome(){const n=++version;try{const [p,s]=await Promise.all([api('/api/progress'),api<Streak>('/api/streak')]);if(alive&&n===version){curriculum.value=p.curriculum;lists.value=p.lists;calendar.value=s;online.value=true;}}catch{if(alive)online.value=false;}}
async function ping(){try{online.value=(await fetch('/health')).ok;}catch{online.value=false;}}
function go(value:View){void navigate(()=>{view.value=value;wordId.value=null;history.replaceState({view:value},'','/');loadHome();});}
async function start(){try{await loadPreferences();go('study');}catch{online.value=false;}}
function openBook(value:LearningView){book.value=value;go('books');}
function openWord(id:number){void navigate(()=>{if(view.value!=='word')previousView.value=view.value;history.replaceState({view:view.value,wordId:wordId.value},'');history.pushState({view:'word',wordId:id},'',`/?word=${id}`);wordHistory=true;wordId.value=id;view.value='word';},id);}
function pop(e:PopStateEvent){const url=location.href,id=Number(new URLSearchParams(location.search).get('word'));void navigate(()=>{history.replaceState(e.state,'',url);if(id>0){wordId.value=id;view.value='word';}else{wordId.value=null;view.value=e.state?.view&&e.state.view!=='word'?e.state.view:previousView.value;loadHome();}},id>0?id:undefined);}
function backWord(){go(previousView.value);wordHistory=false;}
function readingVisibility(){if(view.value==='word'&&wordId.value)void navigate(()=>{});}
function nativeBack(e:Event){
 if(settingsOpen.value){e.preventDefault();window.dispatchEvent(new Event('xiaobei:close-settings'));return;}
 if(view.value==='word'){e.preventDefault();backWord();return;}
 if(view.value==='study'){e.preventDefault();window.dispatchEvent(new Event('xiaobei:pause-study'));return;}
 if(view.value!=='home'){e.preventDefault();go('home');}
}
onMounted(()=>{if(isParent)return;void loadPreferences().catch(()=>{});const id=Number(new URLSearchParams(location.search).get('word'));if(id>0)void navigate(()=>{wordId.value=id;view.value='word';},id);document.addEventListener('visibilitychange',readingVisibility);window.addEventListener('popstate',pop);window.addEventListener('xiaobei:back',nativeBack);window.addEventListener('online',ping);loadHome();timer=setInterval(ping,30000);});
onUnmounted(()=>{alive=false;version++;clearInterval(timer);document.removeEventListener('visibilitychange',readingVisibility);window.removeEventListener('popstate',pop);window.removeEventListener('xiaobei:back',nativeBack);window.removeEventListener('online',ping);});
const tabs=[{view:'home' as const,label:'今日'},{view:'books' as const,label:'单词本'},{view:'browse' as const,label:COPY.wordList},{view:'progress' as const,label:'进度'}];
</script>
<template><ParentView v-if="isParent" /><template v-else><div :inert="settingsOpen" :aria-hidden="settingsOpen?'true':undefined">
<header v-if="view!=='study'" class="top" :class="{searching:searchOpen}"><div class="in"><div class="brand"><span class="logo">W</span>背单词</div><nav class="tabs" aria-label="主导航"><button v-for="tab in tabs" :key="tab.view" :class="{on:activeTab===tab.view}" :aria-current="activeTab===tab.view?'page':undefined" @click="go(tab.view)">{{ tab.label }}</button></nav><SearchBox @open="openWord" @active="searchOpen=$event" /><div class="right"><span class="chip streak"><span class="flame"></span>连续 {{ calendar?.current??0 }} 天</span><button class="settings-button" type="button" aria-label="设置" title="设置" aria-haspopup="dialog" @click="openSettings"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.7 2.2-2 .9-2.1-.5-2 3.4 1.5 1.7v2.6L2.2 15l2 3.4 2.1-.5 2 .9.7 2.2h4l.7-2.2 2-.9 2.1.5 2-3.4-1.5-1.7v-2.6L19.8 9l-2-3.4-2.1.5-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/></svg></button></div></div></header>
<div v-if="navigationError" class="offline" role="alert">阅读记录尚未保存，已保留当前页面。<button :disabled="navigating" @click="retryNavigation">重试保存并继续</button></div>
<div v-if="!online" class="offline" role="alert">暂时连不上学习服务。<button @click="ping();loadHome()">重试</button></div>
<div v-if="isSample" class="sample">当前是示例数据（开发测试用），不是课标词表。</div>
 <LearningHomeView v-if="view==='home'" :streak="calendar" @start="start" @books="openBook" @updated="loadHome" />
<LearningStudyView v-if="keepStudy" v-show="view==='study'" :active="view==='study'&&!navigationError&&!navigating" @cancel="go('home')" @open="openWord" @updated="loadHome" />
<WordBooksView v-if="view==='books'" :initial-view="book" @open="openWord" @start="start" />
<KeepAlive><BrowseView v-if="view==='browse'" @open="openWord" /></KeepAlive>
<WordView v-if="view==='word'&&wordId" :word-id="wordId" :automatic-books="true" @back="backWord" />
<main v-if="view==='progress'&&curriculum" class="page"><h1>学习进度</h1><ProgressPanel :curriculum="curriculum" /><section v-for="l in lists.filter(l=>l.source!=='kb2022')" :key="l.source" class="panel" style="margin-top:20px"><h2>{{ l.source }}：已掌握 {{ l.mastered }}/{{ l.total }}</h2><p>已掌握 {{ l.mastered }} · 熟悉 {{ l.familiar }} · 不熟 {{ l.learning }} · 生词 {{ l.new }}</p></section></main>
<nav v-if="view!=='study'" class="bottombar" aria-label="手机导航"><button v-for="tab in tabs" :key="tab.view" :class="{on:activeTab===tab.view}" :aria-current="activeTab===tab.view?'page':undefined" @click="go(tab.view)"><i aria-hidden="true"></i>{{ tab.label }}</button></nav>
</div><SettingsPanel v-if="settingsOpen" @close="closeSettings" @saved="loadHome" /></template></template>
<style scoped>.settings-button{width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--ink-2);display:grid;place-items:center;flex-shrink:0;transition:background .18s,color .18s,transform .18s;}.settings-button:hover{background:var(--primary-soft);color:var(--primary);transform:rotate(12deg);}.settings-button:focus-visible{outline:2px solid var(--primary);outline-offset:3px;}@media(prefers-reduced-motion:reduce){.settings-button{transition:none;}.settings-button:hover{transform:none;}}</style>
