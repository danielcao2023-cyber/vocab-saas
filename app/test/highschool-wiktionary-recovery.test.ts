import {expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {recordingWordProblem,allowedAudioLicense} from '../server/src/pronunciation-source.ts';
it('keeps each recovered English recording linked to its exact evidence and intact bytes',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 const batches=[['batch-wikirecovery-1.json',18],['batch-wikirecovery-2.json',14],['batch-wikirecovery-3.json',45],['batch-wikirecovery-4.json',44],['batch-wikirecovery-5.json',42],['batch-wikirecovery-6.json',43],['batch-wikirecovery-7.json',46],['batch-wikirecovery-8.json',55],['batch-wikirecovery-9.json',47],['batch-wikirecovery-10.json',44],['batch-wikirecovery-11.json',42],['batch-phrase-recovery-1.json',15],['batch-phrase-recovery-2.json',26],['batch-phrase-recovery-3.json',21],['batch-phrase-recovery-4.json',29],['batch-highschool-recovery-12.json',35],['batch-direct-recovery-1.json',1],['batch-wikialt-2.json',3],['batch-french-recovery-1.json',23],['batch-french-phrase-1.json',1],['batch-french-phrase-2.json',6],['batch-proper-recovery-1.json',37],['batch-properphrase-recovery-1.json',9],['batch-properphrase-recovery-2.json',4]] as const;
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
