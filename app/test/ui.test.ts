import { clientComponent } from './client-components.ts';
import { afterEach, expect, it, vi } from 'vitest';
import { createRenderer, createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import StudyView from '../web/src/views/StudyView.vue';
import ChoiceQuestion from '../web/src/components/ChoiceQuestion.vue';
import RecognizeCard from '../web/src/components/RecognizeCard.vue';
import HomeView from '../web/src/views/HomeView.vue';
import WrongView from '../web/src/views/WrongView.vue';
import DoneView from '../web/src/views/DoneView.vue';
import { buildApp } from '../server/src/app.ts';
import { database, card, T } from './v3-helpers.ts';
import { setWrong } from '../server/src/study.ts';
import { curriculumProgress, streak } from '../server/src/stats.ts';
import type { Card, Turn } from '../web/src/types.ts';

const sample:Card={id:1,word_id:1,mode:'recognize',headword:'whether',phonetic:null,meaning_zh:'conj. 是否\npron. 哪一个\nn. 三\nv. 四',meaning_source:'manual',meaning_flag:null,is_sample:0,state:2,reps:3,level:'三级'};
const question={id:1,qtype:'listen_choice' as const,options:[{wordId:1,text:'conj. 是否'},{wordId:2,text:'n. 天气'},{wordId:3,text:'adv. 一起'},{wordId:4,text:'adv. 宁可'}]};
const render=(component:any,props:any)=>renderToString(createSSRApp({render:()=>h(component,props)}));
it('real Vue rendering hides listening answer before submission, exposes server feedback, and preserves manual meanings',async()=>{
  const before=await render(ChoiceQuestion,{card:sample,question,result:null,busy:false});
  expect(before).not.toContain('whether');expect(before).not.toContain('pron. 哪一个');
  const result={correct:false,answerWordId:1,chosenWordId:2,expected:{...sample},chosen:{headword:'weather',meaning_first_line:'n. 天气'}};
  const after=await render(ChoiceQuestion,{card:sample,question,result,busy:false});
  expect(after).toContain('whether');expect(after).toContain('正确答案是 A');expect(after).toContain('你选的 weather');expect(after).toMatch(/class="[^"]*wrong[^"]*"/);
  const front=await render(RecognizeCard,{card:sample,revealed:false,busy:false});expect(front).not.toContain('conj. 是否');expect(front).not.toContain('class="phon"');
  const back=await render(RecognizeCard,{card:sample,revealed:true,busy:false});expect(back).toContain('v. 四');expect(back).not.toContain('更多释义');
  const ecdict=await render(RecognizeCard,{card:{...sample,meaning_source:'ecdict'},revealed:true,busy:false});expect(ecdict).toContain('更多释义（2）');expect(ecdict).not.toContain('v. 四');
});
it('home, empty/wrong states and done render real counts rather than design placeholders',async()=>{
  const db=database(3);const curriculum=curriculumProgress(db),s=streak(db,T);
  const today={day:'2026-10-17',review:5,new:2,minutes:3,completed:false,streak:0,comparison:null,stats:{answers:7,accuracy:4/7},masteredNew:2,tomorrowReview:9};
  const wrong={items:[],total:0,twoCorrectDays:0};
  const home=await render(HomeView,{today,curriculum,streak:s,wrong,empty:false});expect(home).toContain('刚学的词和答错的词');expect(home).not.toContain('（上周');expect(home).toContain('本月还可补签 2 次');
  expect(await render(WrongView,{wrong,sort:'count',today:today.day,busy:false})).toContain('错词本是空的');
  const incomplete=await render(DoneView,{today,session:{done:2,correct:1}});expect(incomplete).toContain('这一轮的词做完了');expect(incomplete).not.toContain('今天的任务完成了，已打卡');
  expect(await render(DoneView,{today:{...today,completed:true},session:{done:2,correct:1}})).toContain('今天的任务完成了，已打卡');db.close();
});

// Vue's custom renderer exercises the actual component handlers without a browser,
// a DOM dependency, networking or a listening service. Fetches use Fastify.inject.
class Host {
  children:Host[]=[];parent:Host|null=null;props:Record<string,any>={};text='';value='';tagName:string;listeners:Record<string,Function>={};
  constructor(public tag:string){this.tagName=tag.toUpperCase();}
  addEventListener(name:string,fn:Function){this.listeners[name]=fn;}
  removeEventListener(name:string){delete this.listeners[name];}
  setAttribute(name:string,value:any){this.props[name]=value;}
  removeAttribute(name:string){delete this.props[name];}
  getRootNode(){return globalThis.document;}
  focus(){(globalThis.document as any).activeElement=this;}
}
function harness(component:any,props:any){
  const events=new Map<string,Function>();
  vi.stubGlobal('HTMLInputElement',Host);
  class DocumentHost {activeElement:Host|null=null;}
  vi.stubGlobal('Document',DocumentHost);vi.stubGlobal('ShadowRoot',class {});
  vi.stubGlobal('document',new DocumentHost());
  vi.stubGlobal('window',{setInterval:globalThis.setInterval,addEventListener:(name:string,fn:Function)=>events.set(name,fn),removeEventListener:(name:string)=>events.delete(name)});
  const renderer=createRenderer<Host,Host>({
    createElement:tag=>new Host(tag),createText:text=>Object.assign(new Host('#text'),{text}),createComment:text=>Object.assign(new Host('#comment'),{text}),
    setText:(node,text)=>{node.text=text;},setElementText:(node,text)=>{node.text=text;node.children=[];},parentNode:node=>node.parent,nextSibling:node=>node.parent?.children[(node.parent?.children.indexOf(node)??-1)+1]??null,
    patchProp:(node,key,_old,value)=>{node.props[key]=value;if(key==='value')node.value=value;},
    insert:(node,parent,anchor)=>{if(node.parent){const i=node.parent.children.indexOf(node);if(i>=0)node.parent.children.splice(i,1);}node.parent=parent;const i=anchor?parent.children.indexOf(anchor):-1;if(i<0)parent.children.push(node);else parent.children.splice(i,0,node);},
    remove:node=>{if(node.parent){const i=node.parent.children.indexOf(node);if(i>=0)node.parent.children.splice(i,1);node.parent=null;}}
  });
  const root=new Host('root');const app=renderer.createApp(component,props);app.mount(root);
  const find=(predicate:(node:Host)=>boolean):Host|undefined=>{const visit=(node:Host):Host|undefined=>predicate(node)?node:node.children.map(visit).find(Boolean);return visit(root);};
  const text=(node=root):string=>node.text+node.children.map(n=>text(n)).join('');
  return {app,root,find,text,online:()=>events.get('online')?.(),key:(key:string)=>events.get('keydown')?.({key,target:null,preventDefault(){}})};
}
async function flush(){for(let i=0;i<8;i++){await new Promise(resolve=>setImmediate(resolve));await nextTick();}}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('actual StudyView chooses with keyboard, gets server feedback, and ignores repeated input while an answer is in flight',async()=>{
  const db=database();card(db);const api=buildApp(db,{now:()=>T,rng:()=>.5});
  vi.stubGlobal('fetch',vi.fn(async(url:string,options:any)=>{const r=await api.inject({method:options?.method??'GET',url,headers:options?.headers,payload:options?.body});return new Response(r.body,{status:r.statusCode,headers:{'content-type':'application/json'}});}));
  const ui=harness(clientComponent('web/src/views/StudyView.vue'),{prefer:'review',practice:null,estimate:16});
  try{
    await flush();expect(ui.text()).toContain('听到的是哪个意思');expect(ui.text()).not.toContain('word1');
    ui.key('1');ui.key('2');await flush();
    expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:1});expect(ui.text()).toContain('下一个（Enter）');
    expect(ui.find(n=>n.props.class?.includes('right')&&n.props.class?.includes('opt'))).toBeDefined();
    ui.key('Enter');await flush();expect(ui.text()).toContain('翻面');
  }finally{ui.app.unmount();await api.close();db.close();}
});
it('actual StudyView holds an unsaved flip answer, waits for a healthy reconnect, reuses its key, then advances exactly once',async()=>{
  const db=database(2);const api=buildApp(db,{now:()=>T});let up=true;const keys:string[]=[];const online:boolean[]=[];
  vi.stubGlobal('fetch',vi.fn(async(url:string,options:any)=>{if(url==='/api/review'){keys.push(JSON.parse(options.body).answerId);}if(!up)throw new TypeError('offline');const r=await api.inject({method:options?.method??'GET',url,headers:options?.headers,payload:options?.body});return new Response(r.body,{status:r.statusCode});}));
  const ui=harness(clientComponent('web/src/views/StudyView.vue'),{prefer:'review',practice:null,estimate:2,onOnline:(value:boolean)=>online.push(value)});
  try{
    await flush();ui.key('Enter');up=false;ui.key('3');await flush();expect(ui.text()).toContain('这张没存上，连上后会自动补存');
    await ui.online();await flush();expect(keys).toHaveLength(1);
    up=true;await ui.online();await flush();
    expect(new Set(keys).size).toBe(1);expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:1});expect(ui.text()).not.toContain('这张没存上');expect(online).toContain(false);
  }finally{ui.app.unmount();await api.close();db.close();}
});
it('actual spelling input uses Tab hint, renders character feedback and sends practice duration/type through /api/check',async()=>{
  const db=database(1);const id=card(db,1,'spell',0);setWrong(db,1,true,T);const api=buildApp(db,{now:()=>T});
  const c={...sample,id,word_id:1,headword:'word1',mode:'spell' as const,meaning_zh:'n. 测试',state:0};
  vi.stubGlobal('fetch',vi.fn(async(url:string,options:any)=>{const r=await api.inject({method:options?.method??'GET',url,headers:options?.headers,payload:options?.body});return new Response(r.body,{status:r.statusCode});}));
  const ui=harness(clientComponent('web/src/views/StudyView.vue'),{prefer:'review',practice:[{card:c,question:null}],estimate:1});
  try{
    await flush();const input=ui.find(n=>n.tag==='input')!;ui.key('Tab');await nextTick();expect(input.value).toBe('w');
    input.props['onUpdate:modelValue']('wrod1');await nextTick();ui.key('Enter');await flush();
    expect(ui.text()).toContain('差一点');expect(ui.text()).toContain('你写的');expect(ui.text()).toContain('已加入错词本');
    expect(db.prepare('SELECT qtype,context,correct,answer FROM review_logs').get()).toEqual({qtype:'spell',context:'practice',correct:0,answer:'wrod1'});
    expect(ui.find(n=>n.props.class?.includes('diff'))).toBeDefined();
  }finally{ui.app.unmount();await api.close();db.close();}
});
