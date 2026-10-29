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

it('serves the verified disappointment recording online and packs identical bytes offline',async()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entry=catalog.entries.find((e:{key:string})=>e.key==='disappointment');
 expect(entry?.memberships.some((m:{unitId:string})=>m.unitId==='pep2019-compulsory-3:unit4')).toBe(true);
 expect(pronunciationHeadword(entry.headword)).toBe('disappointment');
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.disappointment;
 expect(source).toMatchObject({word:'disappointment',provider:'wikimedia-commons',author:'Dvortygirl',license:'CC BY-SA 3.0',sourceUrl:'https://commons.wikimedia.org/wiki/File:En-us-disappointment.ogg',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0',sha256:'b2112012bb0a44bd86b58f9ac5c2568881e3aa422467d73013a45b4603fc9e5e'});
 // Accent is intentionally not asserted until independently auditioned.
 const bytes=readFileSync(join('data/pronunciation',source.file));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('disappointment','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const tmp=mkdtempSync(join(tmpdir(),'disappointment-pack-'));mkdirSync(join(tmp,'recordings'));
 try{
  const info=await app.inject('/api/pronunciation?word=disappointment');expect(info.statusCode).toBe(200);expect(info.json()).toMatchObject({status:'ready',word:'disappointment',license:'CC BY-SA 3.0'});
  const response=await app.inject('/api/pronunciation/audio?word=disappointment');expect(response.statusCode).toBe(200);expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(source.sha256);
  const pack=packPronunciations({version:1,entries:{disappointment:source}},'data/pronunciation',join(tmp,'recordings'));
  expect(pack.recordings.disappointment.file).toContain('/offline/recordings/');expect(createHash('sha256').update(readFileSync(join(tmp,'recordings',source.file))).digest('hex')).toBe(source.sha256);
  expect(pack.credits).toContain('Dvortygirl');expect(pack.credits).toContain('CC BY-SA 3.0');
 }finally{await app.close();db.close();rmSync(tmp,{recursive:true,force:true});}
});
