<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref} from 'vue';
import {api} from './api';
import {COPY} from './copy';
import type {Streak,Curriculum} from './types';
import type {WordBook} from '../../shared/learning';
import LearningHomeView from './views/LearningHomeView.vue';
import LearningStudyView from './views/LearningStudyView.vue';
import WordBooksView from './views/WordBooksView.vue';
import ParentView from './views/ParentView.vue';
import SearchBox from './components/SearchBox.vue';
import BrowseView from './views/BrowseView.vue';
import WordView from './views/WordView.vue';
import ProgressPanel from './components/ProgressPanel.vue';
import './styles/tokens.css';
import './styles/app.css';
const isParent=location.pathname.replace(/\/$/,'')==='/parent';
type View='home'|'study'|'books'|'progress'|'browse'|'word';
const view=ref<View>('home'),previousView=ref<View>('home'),wordId=ref<number|null>(null),searchOpen=ref(false),online=ref(true);
const calendar=ref<Streak|null>(null),curriculum=ref<Curriculum|null>(null),lists=ref<any[]>([]),book=ref<WordBook>('unfamiliar');
let alive=true,wordHistory=false,timer:ReturnType<typeof setInterval>|undefined,version=0;
const isSample=computed(()=>lists.value.some(l=>l.isSample));
const activeTab=computed(()=>view.value==='word'?previousView.value:view.value);
const keepStudy=computed(()=>view.value==='study'||(view.value==='word'&&previousView.value==='study'));
async function loadHome(){const n=++version;try{const [p,s]=await Promise.all([api('/api/progress'),api<Streak>('/api/streak')]);if(alive&&n===version){curriculum.value=p.curriculum;lists.value=p.lists;calendar.value=s;online.value=true;}}catch{if(alive)online.value=false;}}
async function ping(){try{online.value=(await fetch('/health')).ok;}catch{online.value=false;}}
function go(value:View){view.value=value;wordId.value=null;history.replaceState({view:value},'','/');loadHome();}
function start(){go('study');}
function openBook(value:WordBook){book.value=value;go('books');}
function openWord(id:number){if(view.value!=='word')previousView.value=view.value;history.replaceState({view:view.value,wordId:wordId.value},'');history.pushState({view:'word',wordId:id},'',`/?word=${id}`);wordHistory=true;wordId.value=id;view.value='word';}
function pop(e:PopStateEvent){const id=Number(new URLSearchParams(location.search).get('word'));if(id>0){wordId.value=id;view.value='word';}else{wordId.value=null;view.value=e.state?.view&&e.state.view!=='word'?e.state.view:previousView.value;loadHome();}}
function backWord(){if(wordHistory)history.back();else go(previousView.value);}
onMounted(()=>{if(isParent)return;const id=Number(new URLSearchParams(location.search).get('word'));if(id>0){wordId.value=id;view.value='word';}window.addEventListener('popstate',pop);window.addEventListener('online',ping);loadHome();timer=setInterval(ping,30000);});
onUnmounted(()=>{alive=false;version++;clearInterval(timer);window.removeEventListener('popstate',pop);window.removeEventListener('online',ping);});
const tabs=[{view:'home' as const,label:'今日'},{view:'books' as const,label:'单词本'},{view:'browse' as const,label:COPY.wordList},{view:'progress' as const,label:'进度'}];
</script>
<template><ParentView v-if="isParent" /><template v-else>
<header v-if="view!=='study'" class="top" :class="{searching:searchOpen}"><div class="in"><div class="brand"><span class="logo">W</span>背单词</div><nav class="tabs" aria-label="主导航"><button v-for="tab in tabs" :key="tab.view" :class="{on:activeTab===tab.view}" :aria-current="activeTab===tab.view?'page':undefined" @click="go(tab.view)">{{ tab.label }}</button></nav><SearchBox @open="openWord" @active="searchOpen=$event" /><div class="right"><span class="chip streak"><span class="flame"></span>连续 {{ calendar?.current??0 }} 天</span></div></div></header>
<div v-if="!online" class="offline" role="alert">暂时连不上学习服务。<button @click="ping();loadHome()">重试</button></div>
<div v-if="isSample" class="sample">当前是示例数据（开发测试用），不是课标词表。</div>
 <LearningHomeView v-if="view==='home'" :streak="calendar" :curriculum="curriculum" @start="start" @books="openBook" @updated="loadHome" />
<LearningStudyView v-if="keepStudy" v-show="view==='study'" :active="view==='study'" @cancel="go('home')" @open="openWord" @updated="loadHome" />
<WordBooksView v-if="view==='books'" :initial-book="book" @open="openWord" @start="start" />
<KeepAlive><BrowseView v-if="view==='browse'" @open="openWord" /></KeepAlive>
<WordView v-if="view==='word'&&wordId" :word-id="wordId" :automatic-books="true" @back="backWord" />
<main v-if="view==='progress'&&curriculum" class="page"><h1>学习进度</h1><ProgressPanel :curriculum="curriculum" /><section v-for="l in lists.filter(l=>l.source!=='kb2022')" :key="l.source" class="panel" style="margin-top:20px"><h2>{{ l.source }}：已掌握 {{ l.mastered }}/{{ l.total }}</h2><p>已掌握 {{ l.mastered }} · 熟悉 {{ l.familiar }} · 不熟 {{ l.learning }} · 生词 {{ l.new }}</p></section></main>
<nav v-if="view!=='study'" class="bottombar" aria-label="手机导航"><button v-for="tab in tabs" :key="tab.view" :class="{on:activeTab===tab.view}" :aria-current="activeTab===tab.view?'page':undefined" @click="go(tab.view)"><i aria-hidden="true"></i>{{ tab.label }}</button></nav>
</template></template>
