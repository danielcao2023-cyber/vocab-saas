import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
import {pronunciationHeadword} from '../web/src/audio';

it('serves the verified Picasso recording online and packs identical bytes offline',async()=>{
 const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
 const entry=catalog.entries.find((e:{key:string})=>e.key==='Picasso');
 expect(entry?.memberships.some((m:{unitId:string})=>m.unitId==='pep2019-optional-3:unit1')).toBe(true);
 expect(pronunciationHeadword(entry.headword)).toBe('Picasso');
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.Picasso;
 expect(source).toMatchObject({word:'Picasso',provider:'wikimedia-commons',author:'Speaker: Simplificationalizer Recorder: Simplificationalizer',license:'CC0',sourceUrl:'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Simplificationalizer-Picasso.wav',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0',sha256:'43fb18acdf3fc4f7cb76c868285ab885238fd5e5c790f69f579ea983550f5589'});
 expect(source.accent).toBe('unknown');
 expect(source.pronunciationNote).toContain('尚未人工试听');
 const bytes=readFileSync(join('data/pronunciation',source.file));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('Picasso','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const tmp=mkdtempSync(join(tmpdir(),'Picasso-pack-'));mkdirSync(join(tmp,'recordings'));
 try{
  const info=await app.inject('/api/pronunciation?word=Picasso');expect(info.statusCode).toBe(200);expect(info.json()).toMatchObject({status:'ready',word:'Picasso',license:'CC0'});
  const response=await app.inject('/api/pronunciation/audio?word=Picasso');expect(response.statusCode).toBe(200);expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(source.sha256);
  const pack=packPronunciations({version:1,entries:{Picasso:source}},'data/pronunciation',join(tmp,'recordings'));
  expect(pack.recordings.Picasso.file).toContain('/offline/recordings/');expect(createHash('sha256').update(readFileSync(join(tmp,'recordings',source.file))).digest('hex')).toBe(source.sha256);
  expect(pack.credits).toContain('Simplificationalizer');expect(pack.credits).toContain('CC0');
 }finally{await app.close();db.close();rmSync(tmp,{recursive:true,force:true});}
});
