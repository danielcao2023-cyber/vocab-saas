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
const catalog=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
it('adds nanobot to the textbook unit without changing existing word and learning identities on upgrade',()=>{
 const entry=catalog.entries.find((e:any)=>e.key==='nanobot');expect(entry?.memberships).toContainEqual({bookId:'pep2019-optional-1',unitId:'pep2019-optional-1:unit2',position:158});
 const db=openDb(':memory:');try{db.prepare("INSERT INTO words(id,headword,source) VALUES (80000,'old','kb2022')").run();db.prepare("INSERT INTO wrong_words(word_id,last_wrong_at,wrong_count) VALUES (80000,datetime('now'),2)").run();const previous={...catalog,version:catalog.version-1,entries:catalog.entries.filter((e:any)=>e.key!=='nanobot')};installVocabulary(db,previous);const existing=db.prepare("SELECT id FROM words WHERE headword='Christian'").get();const before=db.prepare("SELECT word_id,unit_id,position FROM vocabulary_members WHERE book_id='pep2019-optional-1' ORDER BY unit_id,position").all();installVocabulary(db,catalog);expect(db.prepare("SELECT id FROM words WHERE headword='Christian'").get()).toEqual(existing);const after=db.prepare("SELECT word_id,unit_id,position FROM vocabulary_members WHERE book_id='pep2019-optional-1' AND word_id!=(SELECT id FROM words WHERE headword='nanobot') ORDER BY unit_id,position").all();expect(after).toEqual(before);const row=db.prepare("SELECT id FROM words WHERE headword='nanobot'").get();installVocabulary(db,catalog);expect(db.prepare("SELECT id FROM words WHERE headword='nanobot'").get()).toEqual(row);expect(db.prepare('SELECT word_id,wrong_count FROM wrong_words').get()).toEqual({word_id:80000,wrong_count:2});}finally{db.close();}
});
it('resolves a keyed lesson at a different ID without serving another word’s numeric lesson',()=>{
 const read=createLessonReader();expect(read({id:999999,headword:'nanobot'})).toMatchObject({status:'ready',lesson:{wordId:999999,headword:'nanobot'}});expect(read({id:1,headword:'nanobot'})).toMatchObject({status:'ready',lesson:{wordId:1,headword:'nanobot'}});expect(read({id:999999,headword:'unrelated'}).status).toBe('pending');
});
it('bundles the keyed lesson and loads it offline using the runtime word ID',async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'nanobot-'));const source=database(2);source.prepare("INSERT INTO words(id,headword,source) VALUES (7777,'nanobot','vocabulary')").run();const db=await openBrowserDatabase(source.serialize());source.close();
 try{const input=fs.mkdtempSync(path.join(os.tmpdir(),'nanobot-input-'));fs.cpSync('data/lessons/keyed',path.join(input,'keyed'),{recursive:true});try{copyReviewedLessons(input,output,[{id:7777,headword:'nanobot',source:'vocabulary'}]);}finally{fs.rmSync(input,{recursive:true,force:true});}expect(fs.existsSync(path.join(output,'keyed','nanobot.json'))).toBe(true);const assets=vi.fn(async(url:any)=>String(url).endsWith('/keyed/nanobot.json')?Response.json(JSON.parse(fs.readFileSync(path.join(output,'keyed','nanobot.json'),'utf8'))):new Response('',{status:404}));const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:assets,recordings:{},now:()=>T});expect(await (await runtime.fetch('/api/word/7777/lesson')).json()).toMatchObject({status:'ready',lesson:{wordId:7777,headword:'nanobot'}});}finally{db.close();fs.rmSync(output,{recursive:true,force:true});}
});
