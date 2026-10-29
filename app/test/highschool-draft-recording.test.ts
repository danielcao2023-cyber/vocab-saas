import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
import {pronunciationHeadword} from '../web/src/audio';

it('serves the verified draft recording online and packs identical bytes offline',async()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entry=catalog.entries.find((e:{key:string})=>e.key==='draft');
 expect(entry?.memberships.some((m:{unitId:string})=>m.unitId==='pep2019-optional-1:unit1')).toBe(true);
 expect(pronunciationHeadword(entry.headword)).toBe('draft');
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.draft;
 expect(source).toMatchObject({word:'draft',provider:'wikimedia-commons',author:'Speaker: Arlo Barnes Recorder: Arlo Barnes',license:'CC0',sourceUrl:'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Arlo_Barnes-draft.wav',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0',sha256:'8cd654a56077a83821c1ab168f55515536bb605c7fd5f25b7344abaa3bf003e6'});
 expect(source.accent).toBe('unknown');
 const bytes=readFileSync(join('data/pronunciation',source.file));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('draft','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const tmp=mkdtempSync(join(tmpdir(),'draft-pack-'));mkdirSync(join(tmp,'recordings'));
 try{
  const info=await app.inject('/api/pronunciation?word=draft');expect(info.statusCode).toBe(200);expect(info.json()).toMatchObject({status:'ready',word:'draft',license:'CC0'});
  const response=await app.inject('/api/pronunciation/audio?word=draft');expect(response.statusCode).toBe(200);expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(source.sha256);
  const pack=packPronunciations({version:1,entries:{draft:source}},'data/pronunciation',join(tmp,'recordings'));
  expect(pack.recordings.draft.file).toContain('/offline/recordings/');expect(createHash('sha256').update(readFileSync(join(tmp,'recordings',source.file))).digest('hex')).toBe(source.sha256);
  expect(pack.credits).toContain('Arlo Barnes');expect(pack.credits).toContain('CC0');
 }finally{await app.close();db.close();rmSync(tmp,{recursive:true,force:true});}
});
