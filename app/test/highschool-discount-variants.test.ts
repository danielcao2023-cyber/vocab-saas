import {expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {bundledAudio,setMobileRecordings} from '../web/src/offline/mobile-mode';

it('exposes sourced discount noun and verb recordings separately on web and offline',async()=>{
 const entries=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8')).entries;
 const record=entries.discount;
 expect(record.variants.noun).toMatchObject({ipa:'/ˈdɪskaʊnt/',author:'Dvortygirl',license:'CC BY-SA 3.0'});
 expect(record.ipa).toBe('/ˈdɪskaʊnt/');expect(record.sha256).toBe(record.variants.noun.sha256);
 expect(record.variants.verb.file).toBe('discount-221617318bcf.mp3');
 expect(record.variants.noun.sourceUrl).toContain('En-us-discount.ogg');
 expect(record.variants.verb.ipa).toBe('/dɪˈskaʊnt/');
 expect(record.variants.noun.sha256).not.toBe(record.variants.verb.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('discount','test')").run();const app=buildApp(db);let local:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try {
  for(const variant of ['noun','verb']){
   const response=await app.inject(`/api/pronunciation/audio?word=discount&variant=${variant}`);expect(response.statusCode).toBe(200);expect(createHash('sha256').update(response.rawPayload).digest('hex')).toBe(record.variants[variant].sha256);
  }
  const defaultAudio=await app.inject('/api/pronunciation/audio?word=discount');expect(defaultAudio.statusCode).toBe(200);expect(createHash('sha256').update(defaultAudio.rawPayload).digest('hex')).toBe(record.variants.noun.sha256);
  const credit=(await app.inject('/api/pronunciation/credits?word=discount')).body;expect(credit).toContain('En-us-discount.ogg');expect(credit).toContain('Vealhurl-discount');
  const pack={discount:{...record,file:'/offline/recordings/'+record.file,variants:Object.fromEntries(Object.entries(record.variants).map(([name,value])=>[name,{...(value as object),file:'/offline/recordings/'+(value as {file:string}).file}]))}};
  setMobileRecordings(pack);expect(bundledAudio('discount')).toBe(pack.discount.variants.noun.file);expect(bundledAudio('discount','noun')).toBe(pack.discount.variants.noun.file);expect(bundledAudio('discount','verb')).toBe(pack.discount.variants.verb.file);
  local=await openBrowserDatabase(db.serialize());const runtime=createLocalRuntime({db:local,save:async()=>{},assetFetch:vi.fn(),recordings:pack,now:()=>new Date('2026-10-21T01:00:00Z')});
  for(const variant of ['noun','verb']){const meta=await(await runtime.fetch(`/api/pronunciation?word=discount&variant=${variant}`)).json();expect(meta.ipa).toBe(record.variants[variant].ipa);expect(meta.author).toBe(record.variants[variant].author);}
 }finally{local?.close();await app.close();db.close();vi.unstubAllGlobals()}
});
