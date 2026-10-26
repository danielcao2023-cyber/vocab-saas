// D4：反馈限流（进程内）：每分钟 10 次请求、每个上海自然日 30 次隐藏；超限 429 且不改库；前端给孩子友好提示。
import {it,expect,vi} from 'vitest';
import {nextTick} from 'vue';
import {buildApp} from '../server/src/app.ts';
import {COPY} from '../web/src/copy.ts';
import {database} from './v3-helpers.ts';
import {snapshot} from './p2-helpers.ts';
import {host,flush} from './p2-host.ts';
function setup(n:number){const db=database(n);let t=new Date('2026-10-17T08:00:00Z');const app=buildApp(db,{now:()=>t});
  const ids=Array.from({length:n},(_,i)=>Number(db.prepare("INSERT INTO word_content(word_id,kind,body_json,status,model,prompt_version,flags_json) VALUES (?,'mnemonic_association','{\"text_zh\":\"联想。\"}','approved','m','p2-v1','[]')").run(i+1).lastInsertRowid));
  const post=(id:number|string,reason='其他')=>app.inject({method:'POST',url:`/api/content/${id}/feedback`,payload:{reason}});
  return {db,app,ids,post,set:(iso:string)=>{t=new Date(iso);},advance:(ms:number)=>{t=new Date(t.getTime()+ms);}};}
it('11th request within a minute is 429 (invalid requests count too), changes nothing, and the window slides',async()=>{
  const s=setup(12);try{
    for(let i=0;i<5;i++)expect((await s.post('1e2')).statusCode).toBe(400);
    for(let i=0;i<5;i++)expect((await s.post(s.ids[i])).statusCode).toBe(200);
    const before=snapshot(s.db),r=await s.post(s.ids[5]);expect(r.statusCode).toBe(429);expect(r.json()).toEqual({error:'too many feedback requests',scope:'minute'});expect(snapshot(s.db)).toEqual(before);
    s.advance(59_000);expect((await s.post(s.ids[5])).statusCode).toBe(429);
    s.advance(1_001);expect((await s.post(s.ids[5])).statusCode).toBe(200);
  }finally{await s.app.close();s.db.close();}
});
it('31st hide in one Shanghai day is 429 and changes nothing; the next Shanghai day (16:00Z) resets',async()=>{
  const s=setup(32);try{s.set('2026-10-17T15:00:00Z');
    for(let i=0;i<30;i++){expect((await s.post(s.ids[i])).statusCode).toBe(200);s.advance(7_000);}
    const before=snapshot(s.db),r=await s.post(s.ids[30]);expect(r.statusCode).toBe(429);expect(r.json().scope).toBe('day');expect(snapshot(s.db)).toEqual(before);
    s.set('2026-10-17T15:59:59Z');expect((await s.post(s.ids[30])).statusCode).toBe(429);
    s.set('2026-10-17T16:00:00Z');expect((await s.post(s.ids[30])).statusCode).toBe(200);
    expect(s.db.prepare('SELECT COUNT(*) n FROM content_feedback').get()).toEqual({n:31});
  }finally{await s.app.close();s.db.close();}
});
it.each([['minute','too many feedback requests',COPY.feedbackTooFast],['day','daily feedback limit reached',COPY.feedbackDayLimit]])('ExplainPanel shows a child-friendly %s-limit message and keeps the block',async(_s,error,msg)=>{
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({error}),{status:429})));
  const content={status:'ready',blocks:[{id:1,kind:'example',body:[{en:'Use this word.',zh:'示例句子。',target:'word'}],flags:[],label:'例句'}]};
  const ui=host('web/src/components/ExplainPanel.vue',{wordId:1,context:'word',content});
  try{await flush();ui.all(n=>n.tag==='button'&&ui.text(n)===COPY.reportContent)[0].props.onClick();await nextTick();await ui.all(n=>n.tag==='button'&&ui.text(n)==='其他')[0].props.onClick();await flush();
    expect(ui.text()).toContain(msg);expect(ui.text()).toContain('示例句子。');expect(ui.text()).not.toContain(COPY.feedbackSaved);expect(ui.text()).not.toContain(error);}finally{ui.app.unmount();}
});
