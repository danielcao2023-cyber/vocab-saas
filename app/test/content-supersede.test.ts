// D1：一种内容有了更新的已批准版本后，旧版本永不再显示；最新版本被隐藏时，这一块什么都不显示。
import {it,expect} from 'vitest';
import {buildApp} from '../server/src/app.ts';
import {getContent} from '../server/src/content.ts';
import {database,T} from './v3-helpers.ts';
const ex=(en:string)=>JSON.stringify([{en:`${en} one two three four five`,zh:'例句。',target:'word1'},{en:`${en} six seven eight nine ten`,zh:'例句二。',target:'word1'}]);
it('hiding the newest example (go #136) does not bring back the older approved one (#116)',async()=>{
  const db=database(2),app=buildApp(db,{now:()=>T});try{
    const ins=(kind:string,body:string,status='approved')=>Number(db.prepare("INSERT INTO word_content(word_id,kind,body_json,status,model,prompt_version,flags_json) VALUES (1,?,?,?,'m','p2-v1','[]')").run(kind,body,status).lastInsertRowid);
    const old=ins('example',ex('old')),assoc=ins('mnemonic_association','{"text_zh":"联想。"}'),newest=ins('example',ex('new'));
    expect(getContent(db,1).blocks.map(b=>b.id)).toEqual([newest,assoc]);
    expect((await app.inject({method:'POST',url:`/api/content/${newest}/feedback`,payload:{reason:'例句不通'}})).statusCode).toBe(200);
    const after=(await app.inject('/api/word/1/content')).json();expect(after.blocks.map((b:any)=>b.id)).toEqual([assoc]);expect(after.blocks.some((b:any)=>b.id===old)).toBe(false);
    expect((await app.inject('/api/word/1')).json().content.blocks.map((b:any)=>b.id)).toEqual([assoc]);
    // 更新的待审版本不取代已批准版本（重新生成时孩子仍看到旧的已批准内容，直到新版本批准）
    ins('mnemonic_association','{"text_zh":"待审。"}','review');expect(getContent(db,1).blocks.map(b=>b.id)).toEqual([assoc]);
    // 新版本批准后才取代
    const approved=ins('example',ex('third'));expect(getContent(db,1).blocks.map(b=>b.id)).toEqual([approved,assoc]);
  }finally{await app.close();db.close();}
});
