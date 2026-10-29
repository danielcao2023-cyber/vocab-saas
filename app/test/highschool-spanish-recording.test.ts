import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
import {pronunciationHeadword} from '../web/src/audio';

it('serves the verified Spanish recording online and packs identical bytes offline',async()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entry=catalog.entries.find((e:{key:string})=>e.key==='Spanish');
 expect(entry?.memberships.some((m:{unitId:string})=>m.unitId==='pep2019-compulsory-1:unit2')).toBe(true);
 expect(pronunciationHeadword(entry.headword)).toBe('Spanish');
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.Spanish;
 expect(source).toMatchObject({word:'Spanish',provider:'wikimedia-commons',author:'Speaker: Grendelkhan Recorder: Grendelkhan',license:'CC0',sourceUrl:'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Grendelkhan-Spanish.wav',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0',sha256:'f33fc59882b65bcb0b4c8a1d774ade955aac714ab887c44a04a473e421bd1955'});
 // Accent is intentionally not asserted until independently auditioned.
 expect(source.accent).toBe('unknown');
 expect(readFileSync('data/pronunciation/spanish-3411059cb8e0.mp3').length).toBeGreaterThan(0);
 const bytes=readFileSync(join('data/pronunciation',source.file));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('Spanish','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const tmp=mkdtempSync(join(tmpdir(),'Spanish-pack-'));mkdirSync(join(tmp,'recordings'));
 try{
  const info=await app.inject('/api/pronunciation?word=Spanish');expect(info.statusCode).toBe(200);expect(info.json()).toMatchObject({status:'ready',word:'Spanish',license:'CC0'});
  const response=await app.inject('/api/pronunciation/audio?word=Spanish');expect(response.statusCode).toBe(200);expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(source.sha256);
  const pack=packPronunciations({version:1,entries:{Spanish:source}},'data/pronunciation',join(tmp,'recordings'));
  expect(pack.recordings.Spanish.file).toContain('/offline/recordings/');expect(createHash('sha256').update(readFileSync(join(tmp,'recordings',source.file))).digest('hex')).toBe(source.sha256);
  expect(pack.credits).toContain('Grendelkhan');expect(pack.credits).toContain('CC0');
 }finally{await app.close();db.close();rmSync(tmp,{recursive:true,force:true});}
});
