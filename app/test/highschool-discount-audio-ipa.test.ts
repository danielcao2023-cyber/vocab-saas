import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
it('exposes the sourced discount recording IPA on web and offline metadata',async()=>{
 const entries=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8')).entries;
 expect(entries.discount.ipa).toBe('/ˈdɪskaʊnt/');
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('discount','test')").run();const app=buildApp(db);
 let offline:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{
  const result=(await app.inject('/api/pronunciation?word=discount')).json();expect(result.ipa).toBe('/ˈdɪskaʊnt/');
  offline=await openBrowserDatabase(db.serialize());
  const runtime=createLocalRuntime({db:offline,save:async()=>{},assetFetch:vi.fn(),recordings:{discount:{...entries.discount,file:'/offline/recordings/'+entries.discount.file}},now:()=>new Date('2026-10-21T01:00:00Z')});
  expect((await(await runtime.fetch('/api/pronunciation?word=discount')).json()).ipa).toBe('/ˈdɪskaʊnt/');
 }finally{offline?.close();await app.close();db.close();}
});
