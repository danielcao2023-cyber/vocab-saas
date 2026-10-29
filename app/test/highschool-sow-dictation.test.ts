import {afterEach,expect,it,vi} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning} from '../server/src/learning/engine';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {bundledAudio,setMobileRecordings} from '../web/src/offline/mobile-mode';

const t=new Date('2026-10-21T01:00:00Z');
afterEach(()=>vi.unstubAllGlobals());
it('sow dictation uses the textbook verb pronunciation online and offline while retaining the noun variant',async()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 const sow=manifest.entries.sow;
 expect(sow.ipa).toBe('/soʊ/');
 expect(sow.sha256).toBe(sow.variants.verb.sha256);
 expect(sow.variants.noun.ipa).toBe('/saʊ/');
 expect(sow.variants.noun.sha256).not.toBe(sow.sha256);
 const db=makeV3Fixture(1,t);db.prepare("UPDATE words SET headword='sow', meaning_zh='vt. 播种', phonetic='/soʊ/' WHERE id=1").run();
 const app=buildApp(db);let browserDb:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{
  startLearning(db,t);const initial=nextLearning(db,t).card!;
  db.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(initial.issueId);
  const card=nextLearning(db,t).card!;expect(card.mode).toBe('dictation');expect(card.audioWord).toBe('sow');
  const defaultAudio=await app.inject('/api/pronunciation/audio?word='+card.audioWord);
  const nounAudio=await app.inject('/api/pronunciation/audio?word=sow&variant=noun');
  expect(defaultAudio.statusCode).toBe(200);expect(nounAudio.statusCode).toBe(200);
  expect(createHash('sha256').update(defaultAudio.rawPayload).digest('hex')).toBe(sow.variants.verb.sha256);
  expect(createHash('sha256').update(nounAudio.rawPayload).digest('hex')).toBe(sow.variants.noun.sha256);
  const meta=(await app.inject('/api/pronunciation?word=sow')).json();expect(meta.ipa).toBe('/soʊ/');
  expect(meta.variants.find((v:{variant:string})=>v.variant==='noun').ipa).toBe('/saʊ/');
  const pack={sow:{...sow,file:'/offline/recordings/'+sow.file,variants:Object.fromEntries(Object.entries(sow.variants).map(([k,v])=>[k,{...(v as object),file:'/offline/recordings/'+(v as {file:string}).file}]))}};
  setMobileRecordings(pack);expect(bundledAudio(card.audioWord!)).toBe(pack.sow.variants.verb.file);expect(bundledAudio('sow','noun')).toBe(pack.sow.variants.noun.file);
  browserDb=await openBrowserDatabase(db.serialize());
  const runtime=createLocalRuntime({db:browserDb,save:async()=>{},assetFetch:vi.fn(),recordings:pack,now:()=>t});
  const offline=await(await runtime.fetch('/api/pronunciation?word=sow')).json();expect(offline.ipa).toBe('/soʊ/');expect(offline.variants.find((v:{variant:string})=>v.variant==='noun').ipa).toBe('/saʊ/');
 }finally{browserDb?.close();await app.close();db.close();}
});
