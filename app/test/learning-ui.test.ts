import {afterEach,expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
import type {LearningCard} from '../shared/learning';
const card:LearningCard={issueId:'issue-1',wordId:5,mode:'dictation',patterns:['_____'],audioWord:'above',options:[],assisted:false};
afterEach(()=>vi.unstubAllGlobals());
it('shows only letter underlines for dictation and offers word learning without exposing the answer',async()=>{
 const learn=vi.fn(),ui=host('web/src/components/FocusStudyCard.vue',{card,answer:'',feedback:null,busy:false,audioFailed:null,onLearn:learn});
 try{await flush();expect(ui.all(n=>n.tag==='input')).toHaveLength(5);expect(ui.text()).not.toContain('above');expect(ui.text()).not.toContain('本卡');expect(ui.text()).not.toContain('/3');
 ui.all(n=>n.tag==='button'&&ui.text(n).includes('学习该词'))[0].props.onClick();expect(learn).toHaveBeenCalledOnce();
 }finally{ui.app.unmount();}
});
it('offers audio deferral only after playback fails and keeps feedback plain text',async()=>{
 const defer=vi.fn(),ui=host('web/src/components/FocusStudyCard.vue',{card,answer:'',feedback:null,busy:false,audioFailed:null,onDefer:defer});
 try{expect(ui.text()).not.toContain('暂缓');ui.updateProps({audioFailed:'failed',feedback:{correct:false,assisted:false,expected:'<img src=x>',meaning:'test',book:'unfamiliar',nextDue:'2026-10-21'}});await flush();
 expect(ui.text()).toContain('<img src=x>');expect(ui.all(n=>n.tag==='img')).toHaveLength(0);
 }finally{ui.app.unmount();}
});
it('keeps the home action on one study path and displays all four books',async()=>{
 const summary={day:'2026-10-20',started:false,total:40,completed:0,deferred:0,newWords:14,reviewWords:26,remaining:40,backlog:0,answers:0,correct:0,books:{new:100,unfamiliar:10,familiar:8,mastered:2}};
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(summary))));const start=vi.fn(),ui=host('web/src/views/LearningHomeView.vue',{onStart:start,streak:{current:0,best:0,calendar:[],badges:[],makeupLeft:2,makeupUsed:0,makeupCandidates:[]}});
 try{await flush();expect(ui.text()).toContain('2026 年 10 月');for(const label of ['已掌握','熟悉','不熟','生词'])expect(ui.text()).toContain(label);expect(ui.text()).not.toContain('先学新词');
 ui.all(n=>n.tag==='button'&&ui.text(n)==='开始背单词')[0].props.onClick();expect(start).toHaveBeenCalledOnce();
 }finally{ui.app.unmount();}
});
it('retains an offline answer and retries the same id without advancing the card',async()=>{
 const summary={day:'2026-10-20',started:true,total:1,completed:0,deferred:0,newWords:1,reviewWords:0,remaining:1,backlog:0,answers:0,correct:0,books:{new:1,unfamiliar:0,familiar:0,mastered:0}};
 const bodies:any[]=[];let offline=true;
 vi.stubGlobal('fetch',vi.fn(async(path:string,init?:RequestInit)=>{
  if(path.endsWith('/answer')){bodies.push(JSON.parse(String(init?.body)));if(offline)throw new TypeError('offline');return new Response(JSON.stringify({correct:true,assisted:false,expected:'above',meaning:'上方',book:'unfamiliar',nextDue:'2026-10-20'}));}
  return new Response(JSON.stringify(path.endsWith('/next')?{kind:'card',summary,card:{...card,mode:'recognize',headword:'above',options:[{id:5,text:'上方'}]}}:summary));
 }));
 const ui=host('web/src/views/LearningStudyView.vue');
 try{await flush();await ui.all(n=>n.tag==='button'&&ui.text(n).includes('上方'))[0].props.onClick();await flush();expect(ui.text()).toContain('答案尚未保存');expect(ui.text()).toContain('above');
  offline=false;await ui.all(n=>n.tag==='button'&&ui.text(n)==='重试保存')[0].props.onClick();await flush();
  expect(bodies).toHaveLength(2);expect(bodies[0]).toEqual(bodies[1]);expect(ui.text()).toContain('答对了');expect(ui.text()).not.toContain('答案尚未保存');
 }finally{ui.app.unmount();}
});
it('marks a lesson visit as assisted and keeps the same question on return',async()=>{
 const summary={day:'2026-10-20',started:true,total:1,completed:0,deferred:0,newWords:1,reviewWords:0,remaining:1,backlog:0,answers:0,correct:0,books:{new:1,unfamiliar:0,familiar:0,mastered:0}};
 const calls:string[]=[],open=vi.fn();vi.stubGlobal('fetch',vi.fn(async(path:string)=>{calls.push(path);return new Response(JSON.stringify(path.endsWith('/next')?{kind:'card',summary,card:{...card,mode:'recognize',headword:'above',options:[{id:5,text:'上方'}]}}:summary));}));
 const ui=host('web/src/views/LearningStudyView.vue',{active:true,onOpen:open});
 try{await flush();await ui.all(n=>n.tag==='button'&&ui.text(n).includes('学习该词'))[0].props.onClick();await flush();expect(calls).toContain('/api/learning/consult');expect(open).toHaveBeenCalledWith(5);
  ui.updateProps({active:false});await flush();ui.updateProps({active:true});await flush();expect(calls.filter(x=>x.endsWith('/next'))).toHaveLength(1);expect(ui.text()).toContain('above');
 }finally{ui.app.unmount();}
});
