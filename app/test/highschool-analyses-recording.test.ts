import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';

it('serves and packs the attributed noun-plural analyses recording',async()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 expect(catalog.entries.find((e:{key:string})=>e.key==='analyses')?.memberships.some((m:{bookId:string})=>m.bookId.startsWith('pep2019-'))).toBe(true);
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.analyses;
 expect(source).toMatchObject({word:'analyses',author:'User:Slashme',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0',sourceUrl:'https://commons.wikimedia.org/wiki/File:En-uk-analyses.ogg',matchedSense:'名词 analysis 的复数',sha256:'c95273b947cfe6d90f5fb42a3324dbb7cef732d11cef4ec9cbac4985a2b80e14'});
 const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 expect(hash(readFileSync(join('data/pronunciation',source.file)))).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('analyses','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const dir=mkdtempSync(join(tmpdir(),'analyses-pack-'));mkdirSync(join(dir,'recordings'));
 try{
  const response=await app.inject('/api/pronunciation/audio?word=analyses');expect(response.statusCode).toBe(200);expect(hash(response.rawPayload)).toBe(source.sha256);
  const packed=packPronunciations({version:1,entries:{analyses:source}},'data/pronunciation',join(dir,'recordings'));
  expect(hash(readFileSync(join(dir,'recordings',source.file)))).toBe(source.sha256);
  expect(packed.credits).toContain('User:Slashme');expect(packed.credits).toContain('CC BY-SA 4.0');
 }finally{await app.close();db.close();rmSync(dir,{recursive:true,force:true});}
});
