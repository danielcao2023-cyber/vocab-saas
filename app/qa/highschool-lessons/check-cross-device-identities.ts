/** Read only the generated mobile seed and lesson assets; all simulated devices use memory databases. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Database from 'better-sqlite3';
import {openDb} from '../../server/src/db.ts';
import {migrateVocabulary} from '../../server/src/vocabulary-import.ts';
import {buildApp} from '../../server/src/app.ts';
import {openBrowserDatabase} from '../../web/src/offline/sqlite.ts';
import {createLocalRuntime} from '../../web/src/offline/runtime.ts';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const seed=path.join(root,'mobile-public/offline/seed.db');
const source=new Database(seed,{readonly:true,fileMustExist:true});
let rows:{id:number;headword:string;keys:string[]}[];
try{
 const members=source.prepare(`SELECT DISTINCT w.id,w.headword FROM words w JOIN vocabulary_members m ON m.word_id=w.id JOIN vocabulary_books b ON b.id=m.book_id WHERE b.category='high' ORDER BY w.id`).all() as {id:number;headword:string}[];
 const keys=source.prepare('SELECT entry_key FROM vocabulary_entry_map WHERE word_id=? ORDER BY entry_key');
 rows=members.map(row=>({...row,keys:(keys.all(row.id) as {entry_key:string}[]).map(x=>x.entry_key)}));
}finally{source.close();}
if(!rows.length)throw Error('Generated seed contains no high-school members.');
const onlineDb=openDb(':memory:');migrateVocabulary(onlineDb);
for(const row of rows){const id=row.id+100000;onlineDb.prepare('INSERT INTO words(id,headword,source) VALUES (?,?,?)').run(id,row.headword,'vocabulary');for(const key of row.keys)onlineDb.prepare('INSERT INTO vocabulary_entry_map(entry_key,word_id) VALUES (?,?)').run(key,id);}
const mobile=await openBrowserDatabase(onlineDb.serialize());const app=buildApp(onlineDb);const failures:{headword:string;keys:string[];online:string;offline:string;bundledOffline:string}[]=[];
function localAssets(base:string):typeof fetch{return async (input)=>{const pathname=String(input);if(!pathname.startsWith('/offline/lessons/'))throw Error('Unexpected asset request');const file=path.join(base,pathname.slice('/offline/lessons/'.length));if(!fs.existsSync(file))return new Response('',{status:404});return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});};}
const runtime=(base:string)=>createLocalRuntime({db:mobile,save:async()=>{},assetFetch:localAssets(base),recordings:{}});
const dev=runtime(path.join(root,'data/lessons')),bundled=runtime(path.join(root,'mobile-public/offline/lessons'));
try{
 for(const row of rows){const id=row.id+100000,expected=row.headword==='Log'&&row.keys.includes('Log')?'log':row.headword;
  const response=await app.inject(`/api/word/${id}/lesson`),online=response.json();
  const result=async(r:ReturnType<typeof runtime>)=>{const reply=await r.fetch(`/api/word/${id}/lesson`);const data=await reply.json();return reply.status===200&&data.status==='ready'&&data.lesson?.wordId===id&&data.lesson?.headword===expected?'ready':`${reply.status}:${data.status??data.error}`;};
  const on=response.statusCode===200&&online.status==='ready'&&online.lesson?.wordId===id&&online.lesson?.headword===expected?'ready':`${response.statusCode}:${online.status??online.error}`;
  const off=await result(dev),pack=await result(bundled);
  if(on!=='ready'||off!=='ready'||pack!=='ready')failures.push({headword:row.headword,keys:row.keys,online:on,offline:off,bundledOffline:pack});
 }
 console.log(JSON.stringify({seed:'mobile-public/offline/seed.db',total:rows.length,withoutStableKey:rows.filter(r=>!r.keys.length).length,successful:rows.length-failures.length,failures},null,2));
 if(failures.length||rows.some(r=>!r.keys.length))process.exitCode=1;
}finally{await app.close();mobile.close();onlineDb.close();}
