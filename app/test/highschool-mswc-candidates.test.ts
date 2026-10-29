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

const items=[['belongings','common_voice_en_101527.opus','90ecadc3dd890259ea7b7e6aa53cb50e45df775d57e29e0106e84d317de76d7e'],['kayaking','common_voice_en_20376420.opus','8a30fa0023b53816bb0d37c516f2708ae26bf0d22adc3d9d8af4ac53c311496d']] as const;
it.each(items)('serves and packs %s with source, provenance and review status',async(word,id,hash)=>{
 const r=JSON.parse(fs.readFileSync('data/pronunciation/manifest.json','utf8')).entries[word];
 expect(r).toMatchObject({word,accent:'unknown',provider:'mswc',license:'CC BY 4.0',sourceLabel:'原始语料压缩包',sha256:hash});
 for(const s of ['MLCommons','Common Voice v3','匿名'])expect(r.author).toContain(s);
 for(const s of [id,'自动对齐','机器识别','未人工试听','口音未知','转码'])expect(r.pronunciationNote).toContain(s);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES (?, 'test')").run(word);const app=buildApp(db);const dir=mkdtempSync(join(tmpdir(),'mswc-audio-'));let local:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{
  expect((await app.inject(`/api/pronunciation?word=${word}`)).json()).toMatchObject({status:'ready',author:r.author,pronunciationNote:r.pronunciationNote});
  const audio=await app.inject(`/api/pronunciation/audio?word=${word}`);expect(audio.statusCode).toBe(200);expect(createHash('sha256').update(audio.rawPayload).digest('hex')).toBe(hash);
  const credit=(await app.inject(`/api/pronunciation/credits?word=${word}`)).body;
  const packed=packPronunciations({version:1,entries:{[word]:r}},'data/pronunciation',dir);
  expect(createHash('sha256').update(readFileSync(join(dir,r.file))).digest('hex')).toBe(hash);
  for(const text of [r.author,id,'自动对齐','未人工试听',r.licenseUrl,'原始语料压缩包']){expect(credit).toContain(text);expect(packed.credits).toContain(text)}
  local=await openBrowserDatabase(db.serialize());const runtime=createLocalRuntime({db:local,save:async()=>{},assetFetch:vi.fn(),recordings:packed.recordings,now:()=>new Date('2026-10-21T01:00:00Z')});
  expect(await(await runtime.fetch(`/api/pronunciation?word=${word}`)).json()).toMatchObject({status:'ready',author:r.author,pronunciationNote:r.pronunciationNote});
 }finally{local?.close();await app.close();db.close();rmSync(dir,{recursive:true,force:true})}
});
it('preserves MSWC recordings when running the Commons importer',()=>{
 const dir=mkdtempSync(join(tmpdir(),'mswc-import-'));try{const all=JSON.parse(fs.readFileSync('data/pronunciation/manifest.json','utf8')).entries;const entries=Object.fromEntries(items.map(([w])=>[w,all[w]]));for(const r of Object.values(entries))expect(r).toBeDefined();fs.writeFileSync(join(dir,'manifest.json'),JSON.stringify({version:1,entries}));
 const p=spawnSync(process.execPath,['--import','tsx','scripts/prepare-pronunciation.ts',`--directory=${dir}`,`--audition-directory=${join(dir,'audition')}`,'--limit=0'],{cwd:process.cwd(),encoding:'utf8',timeout:15000});expect(p.status,p.stderr).toBe(0);expect(JSON.parse(fs.readFileSync(join(dir,'manifest.json'),'utf8')).entries).toEqual(entries);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
