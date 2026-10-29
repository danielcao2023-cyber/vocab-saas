import {expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {recordingWordProblem,allowedAudioLicense} from '../server/src/pronunciation-source.ts';
it('keeps each recovered English recording linked to its exact evidence and intact bytes',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 const batches=[['batch-wikirecovery-1.json',18],['batch-wikirecovery-2.json',14],['batch-wikirecovery-3.json',45],['batch-wikirecovery-4.json',44],['batch-wikirecovery-5.json',42],['batch-wikirecovery-6.json',43],['batch-wikirecovery-7.json',46],['batch-wikirecovery-8.json',55],['batch-wikirecovery-9.json',47],['batch-wikirecovery-10.json',44],['batch-wikirecovery-11.json',42],['batch-phrase-recovery-1.json',15],['batch-phrase-recovery-2.json',26],['batch-phrase-recovery-3.json',21],['batch-phrase-recovery-4.json',29],['batch-highschool-recovery-12.json',35],['batch-direct-recovery-1.json',1],['batch-wikialt-2.json',3],['batch-french-recovery-1.json',23],['batch-french-phrase-1.json',1],['batch-french-phrase-2.json',6],['batch-proper-recovery-1.json',37],['batch-properphrase-recovery-1.json',9],['batch-properphrase-recovery-2.json',4],['batch-french-proper-1.json',16],['batch-parallel-recovery-1.json',6],['batch-parallel-recovery-2.json',4],['batch-parallel-recovery-3.json',3],['batch-parallel-recovery-4.json',1],['batch-parallel-recovery-5.json',4],['batch-parallel-recovery-6.json',2],['batch-process-recovery.json',1],['batch-tryout-recovery.json',1],['batch-next2-recovery.json',4],['batch-next4-recovery.json',7],['batch-next3single-recovery.json',4],['batch-next5-recovery.json',5],['batch-next7single-recovery.json',1],['batch-next8single-recovery.json',2],['batch-affect-recovery.json',1],['batch-next7adj-recovery.json',2],['batch-advocate-recovery.json',1],['batch-pla-recovery.json',1],['batch-led-recovery.json',1],['batch-polish3-recovery.json',3]] as const;
 for(const [file,count] of batches){
 const batch=JSON.parse(fs.readFileSync(new URL('../qa/highschool-later-audio/'+file,import.meta.url),'utf8'));
 expect(batch.added).toHaveLength(count);
 for(const row of batch.added){
  const e=manifest.entries[row.word];expect(e?.word).toBe(row.word);expect(e.accent).toBe('unknown');
  expect(e.author).toBeTruthy();expect(allowedAudioLicense(e.licenseUrl)).toBe(true);
  const title=decodeURIComponent(new URL(e.sourceUrl).pathname.split('/wiki/')[1]);
  expect(recordingWordProblem(row.word,title,{sourceUrl:e.sourceUrl,evidenceUrl:e.evidenceUrl})).toBeUndefined();
  const bytes=fs.readFileSync(new URL('../data/pronunciation/'+e.file,import.meta.url));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(e.sha256);
 }
 }
});

it('keeps the consist verb recording and its public-domain author release intact',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 const batch=JSON.parse(fs.readFileSync(new URL('../qa/highschool-later-audio/batch-consist-recovery.json',import.meta.url),'utf8'));
 expect(batch.added).toHaveLength(1);const entry=manifest.entries.consist;
 expect(entry.license).toBe('Public domain (PD-self)');expect(entry.licenseUrl).toBe(`${entry.sourceUrl}#Licensing`);expect(entry.author).toBe('Dvortygirl');
 expect(entry.pronunciationNote).toContain('动词');expect(recordingWordProblem('consist',decodeURIComponent(new URL(entry.sourceUrl).pathname.split('/wiki/')[1]),{sourceUrl:entry.sourceUrl,evidenceUrl:entry.evidenceUrl})).toBeUndefined();
 expect(createHash('sha256').update(fs.readFileSync(new URL('../data/pronunciation/'+entry.file,import.meta.url))).digest('hex')).toBe(entry.sha256);
});

it('keeps the lever UK recording and its public-domain author release intact',()=>{
 const m=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 const batch=JSON.parse(fs.readFileSync(new URL('../qa/highschool-later-audio/batch-lever-recovery.json',import.meta.url),'utf8'));
 expect(batch.added).toHaveLength(1);const e=m.entries.lever;
 expect(e.license).toBe('Public domain (PD-self)');expect(e.licenseUrl).toBe(`${e.sourceUrl}#Licensing`);expect(e.author).toBe('D3VIL');expect(e.pronunciationNote).toContain('英式');
 expect(recordingWordProblem('lever',decodeURIComponent(new URL(e.sourceUrl).pathname.split('/wiki/')[1]),{sourceUrl:e.sourceUrl,evidenceUrl:e.evidenceUrl})).toBeUndefined();
 expect(createHash('sha256').update(fs.readFileSync(new URL('../data/pronunciation/'+e.file,import.meta.url))).digest('hex')).toBe(e.sha256);
});
