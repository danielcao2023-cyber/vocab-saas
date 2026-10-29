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

it('serves the verified module recording online and packs identical bytes offline',async()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entry=catalog.entries.find((e:{key:string})=>e.key==='module');
 expect(entry?.memberships.some((m:{unitId:string})=>m.unitId==='pep2019-compulsory-3:unit4')).toBe(true);
 expect(pronunciationHeadword(entry.headword)).toBe('module');
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.module;
 expect(source).toMatchObject({word:'module',provider:'wikimedia-commons',author:'Speaker: Vealhurl Recorder: Vealhurl',license:'CC BY-SA 4.0',sourceUrl:'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-module.wav',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0',sha256:'083fe2edc1313915ffb2afe35eabf68af4ea07bc42290dd924bd676b7cd2bb02'});
 // Accent is intentionally not asserted until independently auditioned.
 const bytes=readFileSync(join('data/pronunciation',source.file));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('module','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const tmp=mkdtempSync(join(tmpdir(),'module-pack-'));mkdirSync(join(tmp,'recordings'));
 try{
  const info=await app.inject('/api/pronunciation?word=module');expect(info.statusCode).toBe(200);expect(info.json()).toMatchObject({status:'ready',word:'module',license:'CC BY-SA 4.0'});
  const response=await app.inject('/api/pronunciation/audio?word=module');expect(response.statusCode).toBe(200);expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(source.sha256);
  const pack=packPronunciations({version:1,entries:{module:source}},'data/pronunciation',join(tmp,'recordings'));
  expect(pack.recordings.module.file).toContain('/offline/recordings/');expect(createHash('sha256').update(readFileSync(join(tmp,'recordings',source.file))).digest('hex')).toBe(source.sha256);
  expect(pack.credits).toContain('Vealhurl');expect(pack.credits).toContain('CC BY-SA 4.0');
 }finally{await app.close();db.close();rmSync(tmp,{recursive:true,force:true});}
});
