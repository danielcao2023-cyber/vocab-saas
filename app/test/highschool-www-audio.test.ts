import {expect, it} from 'vitest';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';

it('serves and packs the sourced WWW recording with its review status', async () => {
 const entry=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.WWW;
 expect(entry).toMatchObject({word:'WWW',accent:'uk',author:'ATMarsden',license:'CC BY 4.0'});
 expect(entry.pronunciationNote).toContain('尚未人工试听');
 const db=openDb(':memory:');
 db.prepare("INSERT INTO words(headword,source) VALUES ('WWW','test')").run();
 const app=buildApp(db); const dir=mkdtempSync(join(tmpdir(),'www-audio-'));
 try {
  const metadata=await app.inject('/api/pronunciation?word=WWW');
  expect(metadata.json()).toMatchObject({status:'ready',author:'ATMarsden',pronunciationNote:entry.pronunciationNote});
  const audio=await app.inject('/api/pronunciation/audio?word=WWW');
  expect(audio.statusCode).toBe(200);
  expect(createHash('sha256').update(audio.rawPayload).digest('hex')).toBe(entry.sha256);
  const packed=packPronunciations({version:1,entries:{WWW:entry}},'data/pronunciation',dir);
  expect(createHash('sha256').update(readFileSync(join(dir,entry.file))).digest('hex')).toBe(entry.sha256);
  expect(packed.credits).toContain('尚未人工试听');
  expect(packed.credits).toContain(entry.licenseUrl);
 } finally {await app.close(); db.close(); rmSync(dir,{recursive:true,force:true});}
});
