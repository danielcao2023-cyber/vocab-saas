// Copy to app/test once the reviewed manifest entry and audio are integrated.
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
import {pronunciationHeadword} from '../web/src/audio';

it('serves the verified junior high school recording online and packs identical bytes offline',async()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entry=catalog.entries.find((e:{key:string})=>e.key==='junior high school');
 expect(entry?.memberships.some((m:{unitId:string})=>m.unitId==='pep2019-compulsory-1:welcome')).toBe(true);
 expect(pronunciationHeadword(entry.headword)).toBe('junior high school');
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries['junior high school'];
 expect(source).toMatchObject({word:'junior high school',provider:'wikimedia-commons',author:'Speaker: Vealhurl Recorder: Vealhurl',license:'CC BY-SA 4.0',sourceUrl:'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-junior_high_school.wav',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0',sha256:'4c005ccafe44c55b4b82fca3d6c899fe8768447a1ce3c7a9665ec57745845dc5'});
 expect(source.accent).toBe('unknown');expect(source.pronunciationNote).toContain('尚未人工试听');
 const bytes=readFileSync(join('data/pronunciation',source.file));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('junior high school','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const tmp=mkdtempSync(join(tmpdir(),'junior high school-pack-'));mkdirSync(join(tmp,'recordings'));
 try{
  const info=await app.inject('/api/pronunciation?word=junior high school');expect(info.statusCode).toBe(200);expect(info.json()).toMatchObject({status:'ready',word:'junior high school',license:'CC BY-SA 4.0'});
  const response=await app.inject('/api/pronunciation/audio?word=junior high school');expect(response.statusCode).toBe(200);expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(source.sha256);
  const pack=packPronunciations({version:1,entries:{'junior high school':source}},'data/pronunciation',join(tmp,'recordings'));
  expect(pack.recordings['junior high school'].file).toContain('/offline/recordings/');expect(createHash('sha256').update(readFileSync(join(tmp,'recordings',source.file))).digest('hex')).toBe(source.sha256);
  expect(pack.credits).toContain('Vealhurl');expect(pack.credits).toContain('CC BY-SA 4.0');
 }finally{await app.close();db.close();rmSync(tmp,{recursive:true,force:true});}
});
