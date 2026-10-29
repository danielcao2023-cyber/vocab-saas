import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';

it('bundles the CC0 English accent recording with correct source and intact audio',()=>{
 const {entries}=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8'));
 const r=entries.accent;
 expect(r).toMatchObject({word:'accent',license:'CC0 1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',ipa:'/ˈæksɛnt/'});
 expect(r.sourceUrl).toContain('Yangolin-accent.wav');
 expect(r.evidenceUrl).toBe('https://en.wiktionary.org/wiki/accent#English');
 expect(createHash('sha256').update(readFileSync('data/pronunciation/'+r.file)).digest('hex')).toBe(r.sha256);
});

it('serves the accent audio to the web and includes it in the offline bundle',async()=>{
 const {openDb}=await import('../server/src/db.ts');
 const {buildApp}=await import('../server/src/app.ts');
 const {packPronunciations}=await import('../scripts/mobile-pronunciation-assets.ts');
 const {mkdtempSync,mkdirSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('accent','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const temp=mkdtempSync(join(tmpdir(),'accent-pack-'));mkdirSync(join(temp,'recordings'));
 try {
  const response=await app.inject('/api/pronunciation/audio?word=accent');
  expect(response.statusCode).toBe(200);
  const manifest=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8'));
  const packed=packPronunciations({version:1,entries:{accent:manifest.entries.accent}},'data/pronunciation',join(temp,'recordings'));
  expect(packed.recordings.accent.ipa).toBe('/ˈæksɛnt/');
  expect(readFileSync(join(temp,'recordings',manifest.entries.accent.file)).length).toBeGreaterThan(0);
 } finally {await app.close();db.close();rmSync(temp,{recursive:true,force:true});}
});
