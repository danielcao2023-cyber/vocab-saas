import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons';

it('serves checked Unit 4 senses under the original word identities',()=>{
 const read=createLessonReader();
 for(const [id,headword,title] of [[2530,'orbit','影响范围；势力范围'],[2543,'on board','成为成员；参与'],[2550,'signal','标志着；表明'],[2562,'figure out','计算出']] as const){
  const word={id,headword},raw=JSON.parse(readFileSync(`data/lessons/${id}.json`,'utf8'));
  expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);
  expect(result.status,headword).toBe('ready');expect(result.lesson?.senses.some(s=>s.title===title),headword).toBe(true);
 }
});

it('resolves every current Unit 4 member through the real reader and stable-key seed mapping',async()=>{
 const {default:Database}=await import('better-sqlite3');
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entries=catalog.entries.filter((entry:{memberships:{unitId:string|null}[]})=>entry.memberships.some(m=>m.unitId==='pep2019-compulsory-3:unit4'));
 const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
 try{const query=db.prepare('SELECT w.id,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id WHERE m.entry_key=?');const read=createLessonReader();
  expect(entries.length).toBeGreaterThan(90);
  for(const entry of entries){const word=query.get(entry.key) as {id:number;headword:string}|undefined;expect(word,entry.key).toBeDefined();const result=read(word!);expect(result.status,entry.key).toBe('ready');expect(validateLesson(result.lesson,word!).ok,entry.key).toBe(true);}
 }finally{db.close();}
});
