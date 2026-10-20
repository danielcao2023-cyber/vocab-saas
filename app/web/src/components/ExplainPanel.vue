<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue';
import {api,ClientError} from '../api';
import {COPY} from '../copy';
import type {ContentBlock,WordContent} from '../types';
const props=withDefaults(defineProps<{wordId:number;context?:'recognize'|'answer'|'word';content?:WordContent;hidePending?:boolean}>(),{context:'recognize'});
const pending=():WordContent=>({status:'pending',blocks:[]});
const data=ref<WordContent>(props.content??pending()),open=ref<Record<string,boolean>>({example:props.context!=='word',collocation:props.context==='recognize'}),hidden=ref<number[]>([]),reporting=ref<number|null>(null),limitMsg=ref<string|null>(null),submitting=ref(false);
let alive=true,request=0;
const groups=computed(()=>[
  {key:'example',kinds:['example']},{key:'collocation',kinds:['collocation']},{key:'distinction',kinds:['distinction']},{key:'relations',kinds:['synonym','antonym']},{key:'pronunciation',kinds:['pronunciation']},{key:'memory',kinds:['mnemonic_etymology','mnemonic_association','related_words']},
].map(g=>({...g,blocks:data.value.blocks.filter(b=>g.kinds.includes(b.kind)&&b.body&&(!Array.isArray(b.body)||b.body.length))})).filter(g=>g.blocks.length));
const allOpen=computed(()=>groups.value.length>0&&groups.value.every(g=>open.value[g.key]));
function title(g:typeof groups.value[number]){if(g.key==='relations')return g.blocks.map(b=>b.kind==='synonym'?COPY.synonym:COPY.antonym).join(' · ');return COPY.contentTitles[g.key];}
function preview(b:ContentBlock):string {const x=b.body;if(Array.isArray(x))return x.map(v=>v.en??v.word??v.words?.join(' / ')??'').join(' · ');return x.text_zh??x.explain_zh??x.syllables?.join(' · ')??'';}
function persist(){try{window.localStorage.setItem('explain:'+props.context,JSON.stringify(open.value));}catch{/* storage optional */}}
function toggle(key:string,event:Event){const value=(event.target as HTMLDetailsElement).open;if(open.value[key]===value)return;open.value={...open.value,[key]:value};persist();}
function toggleAll(){const value=!allOpen.value;open.value=Object.fromEntries(groups.value.map(g=>[g.key,value]));persist();}
function keydown(e:KeyboardEvent){const t=e.target as HTMLElement|null;if(t?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(t?.tagName??''))return;if(e.key.toLowerCase()==='e'){toggleAll();e.preventDefault();}}
async function load(){const n=++request;hidden.value=[];data.value=props.content??pending();if(props.content)return;try{const result=await api<WordContent>(`/api/word/${props.wordId}/content`);if(alive&&n===request)data.value=result;}catch{if(alive&&n===request)data.value=pending();}}
async function feedback(id:number,reason:string){if(submitting.value)return;submitting.value=true;try{await api(`/api/content/${id}/feedback`,{reason});hidden.value.push(id);reporting.value=null;}catch(e){/* 404：这条已经看不到了（别处已反馈或已下线），同样收起；其他错误保留以便重试 */if(e instanceof ClientError&&e.status===404){hidden.value.push(id);reporting.value=null;}else if(e instanceof ClientError&&e.status===429)limitMsg.value=e.message.startsWith('daily')?COPY.feedbackDayLimit:COPY.feedbackTooFast;}finally{submitting.value=false;}}
onMounted(()=>{if(props.context!=='word'){try{const saved=JSON.parse(window.localStorage.getItem('explain:'+props.context)??'null');if(saved&&typeof saved==='object')open.value=saved;}catch{/* optional */}}load();window.addEventListener('keydown',keydown);});
watch(()=>props.wordId,load);watch(()=>props.content,v=>{if(v)data.value=v;});
onUnmounted(()=>{alive=false;window.removeEventListener('keydown',keydown);});
</script>
<template><section v-if="groups.length||!hidePending" class="explain"><div class="ex-head"><h3>{{ COPY.explain }}</h3><span class="ai">{{ COPY.aiLabel }}</span><div v-if="groups.length" class="tools"><button type="button" class="link" @click="toggleAll">{{ allOpen?COPY.collapseAll:COPY.expandAll }}</button></div></div>
<div v-if="!groups.length" class="pending"><b>{{ COPY.explainPending }}</b>{{ COPY.explainPendingNote }}</div>
<details v-for="g in groups" :key="g.key" class="blk" :open="!!open[g.key]" @toggle="toggle(g.key,$event)"><summary><span class="ttl">{{ title(g) }}</span><span class="pv">{{ g.blocks.filter(b=>!hidden.includes(b.id)).map(preview).join(' · ') }}</span><span class="chev">▾</span></summary><div class="body">
<template v-for="b in g.blocks" :key="b.id"><p v-if="hidden.includes(b.id)" class="fbmsg" role="status">{{ COPY.feedbackSaved }}</p><div v-else class="content-block">
<ul v-if="b.kind==='example'" class="exs"><li v-for="(x,i) in b.body" :key="i"><div class="en"><template v-for="(part,j) in x.en.split(new RegExp('('+x.target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'))" :key="j"><b v-if="part.toLowerCase()===x.target.toLowerCase()">{{ part }}</b><template v-else>{{ part }}</template></template></div><div class="zh">{{ x.zh }}</div></li></ul>
<div v-else-if="b.kind==='collocation'" class="colls"><div v-for="(x,i) in b.body" :key="i" class="coll"><span class="en">{{ x.en }}</span><span class="zh">{{ x.zh }}</span></div></div>
<div v-else-if="b.kind==='distinction'"><div v-for="(x,i) in b.body" :key="i"><b>{{ x.words.join(' / ') }}</b><p>{{ x.explain_zh }}</p><p v-if="x.example"><span class="en">{{ x.example.en }}</span><br>{{ x.example.zh }}</p></div></div>
<div v-else-if="b.kind==='synonym'||b.kind==='antonym'||b.kind==='related_words'" class="wchips"><span class="rowlbl">{{ b.kind==='synonym'?COPY.synonym:b.kind==='antonym'?COPY.antonym:COPY.relatedWords }}</span><span v-for="x in b.body" :key="x.word" class="wchip"><span class="en">{{ x.word }}</span><span class="zh">{{ x.note_zh??x.zh }}</span><span v-if="!x.inList" class="st out">{{ COPY.outsideList }}</span><span v-else-if="x.learned" class="st">{{ COPY.learned }}</span></span></div>
<div v-else-if="b.kind==='pronunciation'" class="pron"><div class="syl"><template v-for="(s,i) in b.body.syllables" :key="i"><template v-if="i">·</template><span :class="{stress:i===b.body.stress}">{{ s }}</span></template></div><ul><li v-for="s in [...b.body.points_zh,...b.body.common_errors_zh]" :key="s">{{ s }}</li></ul></div>
<div v-else-if="b.kind==='mnemonic_etymology'" class="mn ety"><span class="k">{{ COPY.etymology }}</span><div class="parts"><template v-for="(p,i) in b.body.parts" :key="i"><template v-if="i"> + </template><span>{{ p.form }}</span>「{{ p.meaning_zh }}」</template></div><p>{{ b.body.explain_zh }}</p><div class="src">{{ b.body.chain }}</div><div v-if="b.body.same_root?.length" class="wchips"><span class="rowlbl">{{ COPY.sameRoot }}</span><span v-for="x in b.body.same_root" :key="x.word" class="wchip"><span class="en">{{ x.word }}</span><span class="zh">{{ x.zh }}</span><span v-if="!x.inList" class="st out">{{ COPY.outsideList }}</span><span v-else-if="x.learned" class="st">{{ COPY.learned }}</span></span></div></div>
<div v-else-if="b.kind==='mnemonic_association'" class="mn assoc"><span class="k">{{ COPY.association }}</span><div>{{ b.body.text_zh }}</div></div>
<div class="foot"><button type="button" class="report" :aria-expanded="reporting===b.id" @click="reporting=reporting===b.id?null:b.id;limitMsg=null">{{ COPY.reportContent }}</button></div><p v-if="reporting===b.id&&limitMsg" class="fbmsg limit" role="status">{{ limitMsg }}</p><div v-if="reporting===b.id&&!limitMsg" class="feedback-options"><button v-for="reason in COPY.feedbackReasons" :key="reason" type="button" class="btn" :disabled="submitting" @click="feedback(b.id,reason)">{{ reason }}</button></div>
</div></template></div></details></section></template>
