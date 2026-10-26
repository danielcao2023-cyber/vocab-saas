import {afterEach,expect,it,vi} from 'vitest';
import {host,flush,type Host} from './p2-host';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';

const t=new Date('2026-10-21T01:00:00Z');
afterEach(()=>vi.unstubAllGlobals());

async function setup(failures:Record<string,number>,dictation=false){
 const source=makeV3Fixture(2,t);
 if(dictation){startLearning(source,t);const c=nextLearning(source,t).card!;source.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(c.issueId);}
 const db=await openBrowserDatabase(source.serialize());source.close();
 let failSave=false;
 const requests:{path:string;body:unknown}[]=[];
 const runtime=createLocalRuntime({db,now:()=>t,assetFetch:fetch,recordings:{},save:async()=>{if(failSave)throw new Error('temporary disk failure');}});
 vi.stubGlobal('fetch',async(path:string,init?:RequestInit)=>{
  requests.push({path,body:init?.body?JSON.parse(String(init.body)):undefined});
  failSave=(failures[path]??0)>0;if(failSave)failures[path]--;
  try{return await runtime.fetch(path,init);}finally{failSave=false;}
 });
 const cancel=vi.fn(),open=vi.fn(),ui=host('web/src/views/LearningStudyView.vue',{onCancel:cancel,onOpen:open});
 await flush();
 const button=(label:string):Host=>{const found=ui.all(n=>n.tag==='button'&&ui.text(n).includes(label))[0];if(!found)throw new Error('Missing button: '+label);return found;};
 async function retry(){await button('重试保存').props.onClick();await flush();}
 function cannotLeave(){expect(button('暂停').props.disabled).toBe(true);button('暂停').props.onClick();expect(cancel).not.toHaveBeenCalled();}
 return {db,ui,requests,open,button,retry,cannotLeave,close(){ui.app.unmount();db.close();}};
}

it('retains a failed consult, blocks pause, and retries the same event before opening the lesson',async()=>{
 const s=await setup({'/api/learning/consult':2});
 try{
  await s.button('学习该词').props.onClick();await flush();s.cannotLeave();expect(s.open).not.toHaveBeenCalled();
  await s.retry();s.cannotLeave();expect(s.open).not.toHaveBeenCalled();
  await s.retry();expect(s.open).toHaveBeenCalledOnce();expect(s.button('暂停').props.disabled).toBe(false);
  const bodies=s.requests.filter(r=>r.path==='/api/learning/consult').map(r=>r.body);expect(bodies).toHaveLength(3);expect(bodies[1]).toEqual(bodies[0]);expect(bodies[2]).toEqual(bodies[0]);
  expect(s.db.prepare('SELECT rating FROM review_logs').all()).toEqual([{rating:1}]);
 }finally{s.close();}
});

it.each(['/api/learning/start','/api/learning/next'])('resumes a failed %s before allowing navigation',async(path)=>{
 const s=await setup({[path]:1});
 try{s.cannotLeave();await s.retry();expect(s.button('学习该词')).toBeDefined();expect(s.button('暂停').props.disabled).toBe(false);expect(s.db.prepare('SELECT COUNT(*) n FROM learning_issues').get()?.n).toBe(1);}finally{s.close();}
});

it('resumes deferral and a later next-card save independently without replaying the earlier stage',async()=>{
 const failures={'/api/learning/defer':1},s=await setup(failures,true);
 try{
  await s.button('暂缓此词').props.onClick();await flush();s.cannotLeave();
  // The deferral retry succeeds, but issuing the following card fails to save.
  Object.assign(failures,{'/api/learning/next':1});await s.retry();s.cannotLeave();
  await s.retry();expect(s.button('暂停').props.disabled).toBe(false);expect(s.ui.text()).toContain('汉译英');
  expect(asSharedDb(s.db).prepare("SELECT COUNT(*) n FROM learning_events WHERE kind='technical_defer'").get()).toEqual({n:1});
  expect(s.db.prepare('SELECT COUNT(*) n FROM review_logs').get()?.n).toBe(0);
  expect(s.requests.filter(r=>r.path==='/api/learning/defer')).toHaveLength(2);
 }finally{s.close();}
});

it('keeps a graded answer intact while retrying the lesson exposure write',async()=>{
 const s=await setup({'/api/learning/exposure':1});
 try{
  const input=s.ui.all(n=>n.tag==='input')[0];input.props.onPaste({preventDefault(){},clipboardData:{getData:()=> 'experience'}});await flush();
  await s.button('确认答案').props.onClick();await flush();expect(s.ui.text()).toContain('答对了 👍');
  await s.button('学习该词').props.onClick();await flush();s.cannotLeave();expect(s.open).not.toHaveBeenCalled();
  await s.retry();expect(s.open).toHaveBeenCalledOnce();expect(s.ui.text()).toContain('答对了 👍');
  expect(s.db.prepare('SELECT rating FROM review_logs').all()).toEqual([{rating:3}]);
  const bodies=s.requests.filter(r=>r.path==='/api/learning/exposure').map(r=>r.body);expect(bodies).toHaveLength(2);expect(bodies[1]).toEqual(bodies[0]);
 }finally{s.close();}
});
