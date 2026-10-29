import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {canReusePronunciation} from '../server/src/pronunciation-import-state.ts';
import {recordingWordProblem} from '../server/src/pronunciation-source.ts';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets.ts';

it('uses the documented flashcard spelling variant only with its explicit source and evidence',()=>{
 const entry=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries['flash card'];
 expect(entry).toMatchObject({word:'flash card',accent:'uk',author:'Speaker: Vealhurl Recorder: Vealhurl',license:'CC BY-SA 4.0',evidenceUrl:'https://en.wiktionary.org/wiki/flashcard#English'});
 expect(entry.pronunciationNote).toContain('尚未人工试听');
 expect(canReusePronunciation('flash card',entry,'data/pronunciation')).toBe(true);
 expect(canReusePronunciation('flash cards',{...entry,word:'flash cards'},'data/pronunciation')).toBe(false);
 expect(recordingWordProblem('flash card','File:LL-Q1860 (eng)-Vealhurl-flashcard.wav',{sourceUrl:entry.sourceUrl,evidenceUrl:'https://en.wiktionary.org/wiki/unrelated#English'})).toBeTruthy();
 expect(createHash('sha256').update(readFileSync('data/pronunciation/'+entry.file)).digest('hex')).toBe(entry.sha256);
});

it('serves the same attributed recording online and bundles it for offline use',async()=>{
 const {openDb}=await import('../server/src/db.ts');
 const {buildApp}=await import('../server/src/app.ts');
 const entry=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries['flash card'];
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('flash card','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const temp=mkdtempSync(join(tmpdir(),'flash-card-'));mkdirSync(join(temp,'recordings'));
 try {
  const info=await app.inject('/api/pronunciation?word=flash%20card');
  expect(info.json()).toMatchObject({status:'ready',word:'flash card',license:'CC BY-SA 4.0'});
  expect(info.json().pronunciationNote).toContain('尚未人工试听');
  const response=await app.inject('/api/pronunciation/audio?word=flash%20card');
  expect(response.statusCode).toBe(200);
  expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(entry.sha256);
  const credits=await app.inject('/api/pronunciation/credits?word=flash%20card');
  expect(credits.body).toContain('Vealhurl');expect(credits.body).toContain('CC BY-SA 4.0');
  const packed=packPronunciations({version:1,entries:{'flash card':entry}},'data/pronunciation',join(temp,'recordings'));
  expect(packed.recordings['flash card'].pronunciationNote).toContain('尚未人工试听');
  expect(createHash('sha256').update(readFileSync(join(temp,'recordings',entry.file))).digest('hex')).toBe(entry.sha256);
  expect(packed.credits).toContain('Vealhurl');
 }finally{await app.close();db.close();rmSync(temp,{recursive:true,force:true});}
});
