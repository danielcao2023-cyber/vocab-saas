// D2：只能对孩子当前看得到的内容反馈；其余 404，且库不变。
import {it,expect} from 'vitest';
import {buildApp} from '../server/src/app.ts';
import {database,T} from './v3-helpers.ts';
import {snapshot} from './p2-helpers.ts';
it('feedback on pending, review, generated, already hidden, superseded, unknown-kind or missing content is 404 and changes nothing',async()=>{
  const db=database(2),app=buildApp(db,{now:()=>T});try{
    const ins=(kind:string,status:string,hidden:string|null=null)=>Number(db.prepare("INSERT INTO word_content(word_id,kind,body_json,status,model,prompt_version,flags_json,hidden_at) VALUES (1,?,'{\"text_zh\":\"联想。\"}',?,'m','p2-v1','[]',?)").run(kind,status,hidden).lastInsertRowid);
    const superseded=ins('mnemonic_association','approved');const visible=ins('mnemonic_association','approved');
    const ids={pending:ins('collocation','pending'),review:ins('synonym','review'),generated:ins('antonym','generated'),hidden:ins('pronunciation','approved','2026-10-17T00:00:00Z'),superseded,wrongKind:ins('quiz','approved'),missing:999999};
    const before=snapshot(db);
    for(const [name,id] of Object.entries(ids)){const r=await app.inject({method:'POST',url:`/api/content/${id}/feedback`,payload:{reason:'其他'}});expect(r.statusCode,name).toBe(404);expect(r.json()).toEqual({error:'content not found'});}
    expect(snapshot(db)).toEqual(before);
    expect((await app.inject({method:'POST',url:`/api/content/${visible}/feedback`,payload:{reason:'其他'}})).statusCode).toBe(200);
    expect(db.prepare('SELECT COUNT(*) n FROM content_feedback').get()).toEqual({n:1});
    const again=await app.inject({method:'POST',url:`/api/content/${visible}/feedback`,payload:{reason:'其他'}});expect(again.statusCode).toBe(404);expect(db.prepare('SELECT COUNT(*) n FROM content_feedback').get()).toEqual({n:1});
  }finally{await app.close();db.close();}
});
