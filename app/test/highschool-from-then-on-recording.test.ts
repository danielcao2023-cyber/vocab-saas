import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
import {pronunciationHeadword} from '../web/src/audio';

it('serves and packs the attributed full from then on recording for both textbook forms',async()=>{
 expect(pronunciationHeadword('from (then) on')).toBe('from then on');
 expect(pronunciationHeadword('from then on')).toBe('from then on');
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries['from then on'];
 expect(source).toMatchObject({word:'from then on',accent:'unknown',author:'Speaker: Eilidhmax Recorder: Eilidhmax',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0',sourceUrl:'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Eilidhmax-from_then_on.wav',sha256:'94fc5e26ecc446488d23ee496dcb5e55406122a8950e6f6c35fc5cfe8b84694f'});
 const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 expect(hash(readFileSync(join('data/pronunciation',source.file)))).toBe(source.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('from then on','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const dir=mkdtempSync(join(tmpdir(),'phrase-pack-'));mkdirSync(join(dir,'recordings'));
 try{
  const response=await app.inject('/api/pronunciation/audio?word=from%20then%20on');expect(response.statusCode).toBe(200);expect(hash(response.rawPayload)).toBe(source.sha256);
  const credits=await app.inject('/api/pronunciation/credits?word=from%20then%20on');expect(credits.statusCode).toBe(200);expect(credits.body).toContain('Eilidhmax');expect(credits.body).toContain('CC BY 4.0');
  const packed=packPronunciations({version:1,entries:{'from then on':source}},'data/pronunciation',join(dir,'recordings'));
  expect(hash(readFileSync(join(dir,'recordings',source.file)))).toBe(source.sha256);
  expect(packed.credits).toContain('Eilidhmax');expect(packed.credits).toContain('CC BY 4.0');expect(packed.credits).toContain('尚未人工试听');
 }finally{await app.close();db.close();rmSync(dir,{recursive:true,force:true});}
});
