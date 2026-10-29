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
