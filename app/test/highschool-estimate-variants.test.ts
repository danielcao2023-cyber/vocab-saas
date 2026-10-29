import {expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import fs from 'node:fs';

it('serves the sourced estimate noun and verb recordings with distinct bytes and credits',async()=>{
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('estimate','test')").run();
 const app=buildApp(db);try{
  const manifest=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
  const meta=(await app.inject('/api/pronunciation?word=estimate')).json();
  expect(meta.variants.map((v:{variant:string})=>v.variant)).toEqual(['noun','verb']);
  const digests=[];
  for(const variant of ['noun','verb'] as const){
   const res=await app.inject(`/api/pronunciation/audio?word=estimate&variant=${variant}`);expect(res.statusCode).toBe(200);
   const hash=createHash('sha256').update(res.rawPayload).digest('hex');expect(hash).toBe(manifest.entries.estimate.variants[variant].sha256);digests.push(hash);
  }
  expect(digests[0]).not.toBe(digests[1]);const credits=(await app.inject('/api/pronunciation/credits?word=estimate')).body;expect(credits).toContain('En-us-estimate-noun.ogg');expect(credits).toContain('En-us-estimate-verb.ogg');
 }finally{await app.close();db.close();}
});

it('keeps contrast noun and verb distinct and never substitutes the missing conduct noun',async()=>{
 const db=openDb(':memory:');for(const w of ['conduct','contrast'])db.prepare("INSERT INTO words(headword,source) VALUES (?, 'test')").run(w);
 const app=buildApp(db);try{
  const m=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
  for(const [word,variant] of [['contrast','noun'],['contrast','verb'],['conduct','verb']] as const){
   const res=await app.inject(`/api/pronunciation/audio?word=${word}&variant=${variant}`);expect(res.statusCode).toBe(200);expect(createHash('sha256').update(res.rawPayload).digest('hex')).toBe(m.entries[word].variants[variant].sha256);
  }
  expect((await app.inject('/api/pronunciation/audio?word=conduct&variant=noun')).statusCode).toBe(404);
  const meta=(await app.inject('/api/pronunciation?word=contrast')).json();expect(meta.variants.find((x:{variant:string})=>x.variant==='noun').pronunciationNote).toBe('美式录音');expect(meta.variants.find((x:{variant:string})=>x.variant==='verb').pronunciationNote).toBe('英格兰南部口音');
 }finally{await app.close();db.close();}
});

it('serves distinct sourced noun and verb recordings for stress-changing words',async()=>{
 const db=openDb(':memory:');for(const word of ['import','impact','extract','export','suspect','transport','protest','permit','abuse','exploit'])db.prepare("INSERT INTO words(headword,source) VALUES (?, 'test')").run(word);
 const app=buildApp(db);try{
  const m=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
  for(const word of ['import','impact','extract','export','suspect','transport','protest','permit','abuse','exploit']){
   const meta=(await app.inject(`/api/pronunciation?word=${word}`)).json();expect(meta.variants.map((x:{variant:string})=>x.variant)).toEqual(['noun','verb']);
   const hashes=[];for(const variant of ['noun','verb']){const r=await app.inject(`/api/pronunciation/audio?word=${word}&variant=${variant}`);expect(r.statusCode).toBe(200);const hash=createHash('sha256').update(r.rawPayload).digest('hex');expect(hash).toBe(m.entries[word].variants[variant].sha256);hashes.push(hash);}
   expect(hashes[0]).not.toBe(hashes[1]);
  }
 }finally{await app.close();db.close();}
});

it('keeps moderate adjective as the default and its verb as a separate recording',async()=>{
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('moderate','test')").run();
 const app=buildApp(db);try{
  const meta=(await app.inject('/api/pronunciation?word=moderate')).json();expect(meta.pronunciationNote).toContain('形容词');
  expect(meta.variants.map((x:{variant:string})=>x.variant)).toEqual(['verb']);
  const base=await app.inject('/api/pronunciation/audio?word=moderate');const verb=await app.inject('/api/pronunciation/audio?word=moderate&variant=verb');
  expect(base.statusCode).toBe(200);expect(verb.statusCode).toBe(200);expect(createHash('sha256').update(base.rawPayload).digest('hex')).not.toBe(createHash('sha256').update(verb.rawPayload).digest('hex'));
 }finally{await app.close();db.close();}
});

it('keeps complex adjective as default and makes the noun pronunciation available',async()=>{
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('complex','test')").run();
 const app=buildApp(db);try{
  const meta=(await app.inject('/api/pronunciation?word=complex')).json();expect(meta.pronunciationNote).toContain('形容词');
  expect(meta.variants.map((x:{variant:string})=>x.variant)).toEqual(['noun']);
  const base=await app.inject('/api/pronunciation/audio?word=complex');const noun=await app.inject('/api/pronunciation/audio?word=complex&variant=noun');
  expect(base.statusCode).toBe(200);expect(noun.statusCode).toBe(200);expect(createHash('sha256').update(base.rawPayload).digest('hex')).not.toBe(createHash('sha256').update(noun.rawPayload).digest('hex'));
 }finally{await app.close();db.close();}
});

it('keeps advocate verb as default and provides the distinct noun recording',async()=>{
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('advocate','test')").run();
 const app=buildApp(db);try{
  const meta=(await app.inject('/api/pronunciation?word=advocate')).json();expect(meta.pronunciationNote).toContain('动词');
  expect(meta.variants.map((x:{variant:string})=>x.variant)).toEqual(['noun']);
  const base=await app.inject('/api/pronunciation/audio?word=advocate');const noun=await app.inject('/api/pronunciation/audio?word=advocate&variant=noun');
  expect(base.statusCode).toBe(200);expect(noun.statusCode).toBe(200);expect(createHash('sha256').update(base.rawPayload).digest('hex')).not.toBe(createHash('sha256').update(noun.rawPayload).digest('hex'));
 }finally{await app.close();db.close();}
});
