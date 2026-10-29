import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';

it('serves and packs puzzle with corpus attribution, conversion and review status',async()=>{
 const all=JSON.parse(fs.readFileSync('data/pronunciation/manifest.json','utf8'));const word='puzzle';const r=all.entries[word];
 expect(r).toMatchObject({word,accent:'unknown',license:'CC BY 4.0',sourceLabel:'原始录音压缩包',ipa:'/ˈpʌzəl/'});
 expect(r.author).toContain('Marxer');expect(r.pronunciationNote).toContain('T_33145.wav');expect(r.pronunciationNote).toContain('左声道');expect(r.pronunciationNote).toContain('未人工试听');expect(r.pronunciationNote).toContain('口音');
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES (?, 'test')").run(word);const app=buildApp(db);const dir=mkdtempSync(join(tmpdir(),'eccc-puzzle-'));let local:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try {const meta=(await app.inject('/api/pronunciation?word=puzzle')).json();expect(meta).toMatchObject({status:'ready',author:r.author,pronunciationNote:r.pronunciationNote,ipa:r.ipa});const audio=await app.inject('/api/pronunciation/audio?word=puzzle');expect(audio.statusCode).toBe(200);expect(createHash('sha256').update(audio.rawPayload).digest('hex')).toBe(r.sha256);
  const credit=(await app.inject('/api/pronunciation/credits?word=puzzle')).body;for(const text of [r.author,'T_33145.wav','未人工试听','左声道','原始录音压缩包',r.licenseUrl])expect(credit).toContain(text);
  const packed=packPronunciations({version:1,entries:{[word]:r}},'data/pronunciation',dir);expect(createHash('sha256').update(readFileSync(join(dir,r.file))).digest('hex')).toBe(r.sha256);for(const text of [r.author,'T_33145.wav','未人工试听','左声道','原始录音压缩包',r.licenseUrl])expect(packed.credits).toContain(text);
  local=await openBrowserDatabase(db.serialize());const runtime=createLocalRuntime({db:local,save:async()=>{},assetFetch:vi.fn(),recordings:packed.recordings,now:()=>new Date('2026-10-21T01:00:00Z')});expect(await(await runtime.fetch('/api/pronunciation?word=puzzle')).json()).toMatchObject({status:'ready',author:r.author,pronunciationNote:r.pronunciationNote,ipa:r.ipa});
 }finally{local?.close();await app.close();db.close();rmSync(dir,{recursive:true,force:true})}
});
it('the Commons importer preserves the independently sourced puzzle',()=>{
 const dir=mkdtempSync(join(tmpdir(),'eccc-import-'));try{const r=JSON.parse(fs.readFileSync('data/pronunciation/manifest.json','utf8')).entries.puzzle;expect(r).toBeDefined();fs.writeFileSync(join(dir,'manifest.json'),JSON.stringify({version:1,entries:{puzzle:r}}));const p=spawnSync(process.execPath,['--import','tsx','scripts/prepare-pronunciation.ts',`--directory=${dir}`,`--audition-directory=${join(dir,'audition')}`,'--limit=0'],{cwd:process.cwd(),encoding:'utf8',timeout:15000});expect(p.status,p.stderr).toBe(0);expect(JSON.parse(fs.readFileSync(join(dir,'manifest.json'),'utf8')).entries.puzzle).toEqual(r)}finally{rmSync(dir,{recursive:true,force:true})}
});
