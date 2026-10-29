import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';

it('serves and packs the exact Merry Christmas recording with complete corpus attribution',async()=>{
 const all=JSON.parse(fs.readFileSync('data/pronunciation/manifest.json','utf8'));const word='Merry Christmas!';const recording=all.entries[word];
 expect(recording).toMatchObject({word,accent:'uk',license:'CC BY-SA 4.0',sourceLabel:'原始录音压缩包'});
 expect(recording.author).toContain('Google');expect(recording.author).toContain('匿名');
 expect(recording.pronunciationNote).toContain('sof_07060_01012381485');expect(recording.pronunciationNote).toContain('转码');expect(recording.pronunciationNote).toContain('未人工试听');
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES (?, 'test')").run(word);const app=buildApp(db);const dir=mkdtempSync(join(tmpdir(),'openslr-merry-'));let local:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try {
  const meta=(await app.inject('/api/pronunciation?word='+encodeURIComponent(word))).json();expect(meta.status).toBe('ready');expect(meta.sourceUrl).toBe(recording.sourceUrl);expect(meta.author).toBe(recording.author);expect(meta.pronunciationNote).toBe(recording.pronunciationNote);
  const audio=await app.inject('/api/pronunciation/audio?word='+encodeURIComponent(word));expect(audio.statusCode).toBe(200);expect(createHash('sha256').update(audio.rawPayload).digest('hex')).toBe(recording.sha256);
  const credit=(await app.inject('/api/pronunciation/credits?word='+encodeURIComponent(word))).body;for(const text of [recording.author,'sof_07060_01012381485','未人工试听','转码','原始录音压缩包',recording.licenseUrl])expect(credit).toContain(text);
  const packed=packPronunciations({version:1,entries:{[word]:recording}},'data/pronunciation',dir);const offline=packed.recordings[word];expect(createHash('sha256').update(readFileSync(join(dir,recording.file))).digest('hex')).toBe(recording.sha256);for(const text of [recording.author,'sof_07060_01012381485','未人工试听','转码','原始录音压缩包',recording.licenseUrl])expect(packed.credits).toContain(text);
  local=await openBrowserDatabase(db.serialize());const runtime=createLocalRuntime({db:local,save:async()=>{},assetFetch:vi.fn(),recordings:packed.recordings,now:()=>new Date('2026-10-21T01:00:00Z')});const localMeta=await(await runtime.fetch('/api/pronunciation?word='+encodeURIComponent(word))).json();expect(localMeta).toMatchObject({status:'ready',author:recording.author,pronunciationNote:recording.pronunciationNote});
 }finally{local?.close();await app.close();db.close();rmSync(dir,{recursive:true,force:true})}
});
it('the Commons importer leaves the independently sourced entry intact',async()=>{
 const {spawnSync}=await import('node:child_process');const dir=mkdtempSync(join(tmpdir(),'openslr-import-'));
 try{const original=JSON.parse(fs.readFileSync('data/pronunciation/manifest.json','utf8')).entries['Merry Christmas!'];fs.writeFileSync(join(dir,'manifest.json'),JSON.stringify({version:1,entries:{'Merry Christmas!':original}}));
  const proc=spawnSync(process.execPath,['--import','tsx','scripts/prepare-pronunciation.ts',`--directory=${dir}`,`--audition-directory=${join(dir,'audition')}`,'--limit=0'],{cwd:process.cwd(),encoding:'utf8',timeout:15000});expect(proc.status,proc.stderr).toBe(0);expect(JSON.parse(fs.readFileSync(join(dir,'manifest.json'),'utf8')).entries['Merry Christmas!']).toEqual(original);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
