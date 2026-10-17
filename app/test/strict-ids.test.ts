// D3：第二期所有 :id 路由严格按 /^[1-9]\d*$/ 解析，否则 400，且不改库。
import {it,expect} from 'vitest';
import {buildApp} from '../server/src/app.ts';
import {parseId} from '../server/src/http-error.ts';
import {database,T} from './v3-helpers.ts';
import {snapshot} from './p2-helpers.ts';
const BAD=['1e2','01','0','-1','1.0','+1','0x10',' 1','1 ','1a','9007199254740993','NaN','Infinity','%201','1%00','１'];
it('parseId accepts only canonical positive integers',()=>{for(const ok of ['1','42','9007199254740991'])expect(parseId(ok)).toBe(Number(ok));for(const bad of [...BAD,'',undefined,null,1])expect(()=>parseId(bad as any)).toThrow();});
it.each(BAD)('id %j is 400 on every phase-2 :id route and changes nothing',async bad=>{
  const db=database(2),app=buildApp(db,{now:()=>T});try{
    db.prepare("INSERT INTO word_content(id,word_id,kind,body_json,status,model,prompt_version,flags_json) VALUES (100,1,'mnemonic_association','{\"text_zh\":\"联想。\"}','approved','m','p2-v1','[]')").run();
    const before=snapshot(db),u=encodeURIComponent(bad).replace(/%25/g,'%');
    for(const url of [`/api/word/${u}`,`/api/word/${u}/content`])expect((await app.inject(url)).statusCode,url).toBe(400);
    expect((await app.inject({method:'POST',url:`/api/content/${u}/feedback`,payload:{reason:'其他'}})).statusCode).toBe(400);
    expect(snapshot(db)).toEqual(before);
  }finally{await app.close();db.close();}
});
it('valid ids still work; unknown word is 404 on both word routes',async()=>{
  const db=database(2),app=buildApp(db,{now:()=>T});try{
    expect((await app.inject('/api/word/1')).statusCode).toBe(200);expect((await app.inject('/api/word/1/content')).json()).toEqual({status:'pending',blocks:[]});
    expect((await app.inject('/api/word/99')).statusCode).toBe(404);expect((await app.inject('/api/word/99/content')).statusCode).toBe(404);
  }finally{await app.close();db.close();}
});
