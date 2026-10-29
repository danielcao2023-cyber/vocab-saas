import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createLessonReader} from '../server/src/lessons';
import {copyReviewedLessons} from '../scripts/lesson-assets';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {database,T} from './v3-helpers';
import {installVocabulary} from '../server/src/vocabulary-import';
import {openDb} from '../server/src/db';
it('resolves a keyed lesson at a different ID without serving another word’s numeric lesson',()=>{
 const read=createLessonReader();expect(read({id:999999,headword:'module'})).toMatchObject({status:'ready',lesson:{wordId:999999,headword:'module'}});expect(read({id:1,headword:'module'})).toMatchObject({status:'ready',lesson:{wordId:1,headword:'module'}});expect(read({id:999999,headword:'unrelated'}).status).toBe('pending');
});
it('bundles the keyed lesson and loads it offline using the runtime word ID',async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'module-'));const source=database(2);source.prepare("INSERT INTO words(id,headword,source) VALUES (7777,'module','vocabulary')").run();const db=await openBrowserDatabase(source.serialize());source.close();
 try{const input=fs.mkdtempSync(path.join(os.tmpdir(),'module-input-'));fs.cpSync('data/lessons/keyed',path.join(input,'keyed'),{recursive:true});try{copyReviewedLessons(input,output,[{id:7777,headword:'module',source:'vocabulary'}]);}finally{fs.rmSync(input,{recursive:true,force:true});}expect(fs.existsSync(path.join(output,'keyed','module.json'))).toBe(true);const assets=vi.fn(async(url:any)=>String(url).endsWith('/keyed/module.json')?Response.json(JSON.parse(fs.readFileSync(path.join(output,'keyed','module.json'),'utf8'))):new Response('',{status:404}));const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:assets,recordings:{},now:()=>T});expect(await (await runtime.fetch('/api/word/7777/lesson')).json()).toMatchObject({status:'ready',lesson:{wordId:7777,headword:'module'}});}finally{db.close();fs.rmSync(output,{recursive:true,force:true});}
});
