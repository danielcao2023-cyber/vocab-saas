import {expect,it,vi} from 'vitest';
import {database,T} from './v3-helpers';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {bundledAudio,setMobileRecordings} from '../web/src/offline/mobile-mode';

const base={word:'word1',file:'/offline/recordings/default.mp3',accent:'us',sourceUrl:'https://example.com/default',author:'A',license:'CC BY',licenseUrl:'https://example.com/license'};
const noun={...base,file:'/offline/recordings/noun.mp3',sourceUrl:'https://example.com/noun',author:'N'};
const verb={...base,file:'/offline/recordings/verb.mp3',sourceUrl:'https://example.com/verb',author:'V'};
const recordings={word1:{...base,variants:{noun,verb}}};

it('resolves specified bundled variants without falling back to the default',()=>{
 setMobileRecordings(recordings);
 expect(bundledAudio('word1')).toBe(base.file);
 expect(bundledAudio('word1','noun')).toBe(noun.file);
 expect(bundledAudio('word1','verb')).toBe(verb.file);
 expect(bundledAudio('word1','other')).toBeUndefined();
 expect(bundledAudio('missing','noun')).toBeUndefined();
});

it('returns the metadata of the requested variant and rejects unavailable variants',async()=>{
 const source=database(1),db=await openBrowserDatabase(source.serialize());source.close();
 try {
  const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:vi.fn(),recordings,now:()=>T});
  const request=(suffix:string)=>runtime.fetch('/api/pronunciation?word=word1'+suffix);
  expect((await (await request('')).json()).author).toBe('A');
  const response=await request('&variant=noun');
  expect(response.status).toBe(200);expect((await response.json()).author).toBe('N');
  expect((await (await request('&variant=verb')).json()).author).toBe('V');
  expect((await request('&variant=other')).status).toBe(400);
  expect((await (await request('&variant=noun')).json()).file).toBeUndefined();
 }finally{db.close();}
});

it('lists only available variants and validates repeated variant parameters',async()=>{
 const source=database(1),db=await openBrowserDatabase(source.serialize());source.close();
 try {
  const variantOnly={word1:{word:'word1',variants:{noun:{...noun,ipa:'/ˈx/',pronunciationNote:'加拿大口音'}}}} as any;
  const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:vi.fn(),recordings:variantOnly,now:()=>T});
  const result=await(await runtime.fetch('/api/pronunciation?word=word1')).json();
  expect(result.status).toBe('missing');
  expect(result.variants).toEqual([{variant:'noun',label:'名词',ipa:'/ˈx/',pronunciationNote:'加拿大口音'}]);
  expect((await (await runtime.fetch('/api/pronunciation?word=word1&variant=verb')).json()).status).toBe('missing');
  expect((await runtime.fetch('/api/pronunciation?word=word1&variant=noun&variant=verb')).status).toBe(400);
  expect((await runtime.fetch('/api/pronunciation?word=word1&variant%5B%5D=noun')).status).toBe(400);
  expect((await runtime.fetch('/api/pronunciation?word=word1&variant%5Bnoun%5D=1')).status).toBe(400);
 }finally{db.close();}
});
