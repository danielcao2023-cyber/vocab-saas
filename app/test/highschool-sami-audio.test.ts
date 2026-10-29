import {expect, it} from 'vitest';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';

it('serves and packs the sourced Sami variant with its review status', async () => {
 const entry=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.Sami;
 expect(entry).toMatchObject({word:'Sami',accent:'uk',ipa:'/ˈsɑːmi/',license:'CC BY-SA 4.0'});
 expect(entry.pronunciationNote).toContain('尚未人工试听');
 const db=openDb(':memory:'); db.prepare("INSERT INTO words(headword,source) VALUES ('Sami','test')").run();
 const app=buildApp(db); const dir=mkdtempSync(join(tmpdir(),'sami-audio-'));
 try {
  expect((await app.inject('/api/pronunciation?word=Sami')).json()).toMatchObject({status:'ready',ipa:entry.ipa,pronunciationNote:entry.pronunciationNote});
  const audio=await app.inject('/api/pronunciation/audio?word=Sami'); expect(audio.statusCode).toBe(200);
  expect(createHash('sha256').update(audio.rawPayload).digest('hex')).toBe(entry.sha256);
  const packed=packPronunciations({version:1,entries:{Sami:entry}},'data/pronunciation',dir);
  expect(createHash('sha256').update(readFileSync(join(dir,entry.file))).digest('hex')).toBe(entry.sha256);
  expect(packed.credits).toContain('尚未人工试听'); expect(packed.credits).toContain(entry.licenseUrl);
 } finally {await app.close(); db.close(); rmSync(dir,{recursive:true,force:true});}
});
