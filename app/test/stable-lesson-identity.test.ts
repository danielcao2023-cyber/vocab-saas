import {makeLessonIdentityIndex} from '../scripts/lesson-identity-index';
import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import {buildApp} from '../server/src/app';
import {openDb} from '../server/src/db';
import {migrateVocabulary} from '../server/src/vocabulary-import';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {T} from './v3-helpers';

function fixture(id:number,headword='title',key='title'){
 const db=openDb(':memory:');migrateVocabulary(db);db.prepare('INSERT INTO words(id,headword,source) VALUES (?,?,?)').run(id,headword,'vocabulary');db.prepare('INSERT INTO vocabulary_entry_map(entry_key,word_id) VALUES (?,?)').run(key,id);return db;
}
it('online resolves a stable catalog identity when its local ID collides with another lesson',async()=>{
 const db=fixture(1654);const app=buildApp(db);try{const result=(await app.inject('/api/word/1654/lesson')).json();expect(result).toMatchObject({status:'ready',lesson:{wordId:1654,headword:'title'}});}finally{await app.close();db.close();}
});
it('offline resolves a stable identity despite a missing or colliding numeric lesson',async()=>{
 for(const id of [1654,999999]){const source=fixture(id);const db=await openBrowserDatabase(source.serialize());source.close();
 try{const assetFetch=vi.fn(async(url:any)=>{const file='data/lessons/'+String(url).replace('/offline/lessons/','');return fs.existsSync(file)?Response.json(JSON.parse(fs.readFileSync(file,'utf8'))):new Response('',{status:404});});const runtime=createLocalRuntime({db,save:async()=>{},assetFetch,recordings:{},now:()=>T});expect(await (await runtime.fetch(`/api/word/${id}/lesson`)).json()).toMatchObject({status:'ready',lesson:{wordId:id,headword:'title'}});}finally{db.close();}}
});
it('keeps normal lesson identity and refuses fallback for an unmapped or mismatched key',async()=>{
 for(const [id,word,key,status] of [[1653,'title','title','ready'],[1654,'title','not-title','pending'],[1654,'different','title','pending']] as const){const db=fixture(id,word,key),app=buildApp(db);try{const result=(await app.inject(`/api/word/${id}/lesson`)).json();expect(result.status).toBe(status);if(status==='ready')expect(result.lesson).toMatchObject({wordId:id,headword:word});}finally{await app.close();db.close();}}
});
it('does not disturb the special Log display or keyed lesson',async()=>{
 const db=fixture(7777,'Log','Log'),app=buildApp(db);try{expect((await app.inject('/api/word/7777/lesson')).json()).toMatchObject({status:'ready',lesson:{wordId:7777,headword:'log'}});}finally{await app.close();db.close();}
});
it('index points only to matching canonical lesson identities and known keys',()=>{
 const index=JSON.parse(fs.readFileSync('shared/lesson-identities.json','utf8')),catalog=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));const keys=new Set(catalog.entries.map((entry:any)=>entry.key));
 for(const [key,item] of Object.entries(index) as [string,{id:number;headword:string}][]){expect(keys.has(key),key).toBe(true);const d=JSON.parse(fs.readFileSync(`data/lessons/${item.id}.json`,'utf8'));expect({id:d.wordId,headword:d.headword},key).toEqual(item);}
});

it('generated index stays synchronized with the catalog, curated aliases and reviewed lesson resources',()=>{expect(JSON.parse(fs.readFileSync('shared/lesson-identities.json','utf8'))).toEqual(makeLessonIdentityIndex());});
it('offline rejects unrelated numeric content when the key is absent or belongs to another word',async()=>{
 for(const [word,key] of [['title','unmapped'],['different','title']]){const source=fixture(1654,word,key);const db=await openBrowserDatabase(source.serialize());source.close();try{const assetFetch=vi.fn(async(url:any)=>{const file='data/lessons/'+String(url).replace('/offline/lessons/','');return fs.existsSync(file)?Response.json(JSON.parse(fs.readFileSync(file,'utf8'))):new Response('',{status:404});});const runtime=createLocalRuntime({db,save:async()=>{},assetFetch,recordings:{},now:()=>T});expect((await runtime.fetch('/api/word/1654/lesson')).status).toBe(503);}finally{db.close();}}
});
it('offline treats an absent unmapped lesson as pending rather than a corrupt asset',async()=>{
 const source=fixture(999999,'title','unmapped');const db=await openBrowserDatabase(source.serialize());source.close();try{const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:async()=>new Response('',{status:404}),recordings:{},now:()=>T});expect(await (await runtime.fetch('/api/word/999999/lesson')).json()).toEqual({status:'pending',lesson:null});}finally{db.close();}
});
it('offline resolves special Log independent of local numeric ID',async()=>{
 const source=fixture(7777,'Log','Log');const db=await openBrowserDatabase(source.serialize());source.close();try{const assetFetch=vi.fn(async(url:any)=>{const file='data/lessons/'+String(url).replace('/offline/lessons/','');return fs.existsSync(file)?Response.json(JSON.parse(fs.readFileSync(file,'utf8'))):new Response('',{status:404});});const runtime=createLocalRuntime({db,save:async()=>{},assetFetch,recordings:{},now:()=>T});expect(await (await runtime.fetch('/api/word/7777/lesson')).json()).toMatchObject({status:'ready',lesson:{wordId:7777,headword:'log'}});}finally{db.close();}
});
