import {afterEach,expect,it,vi} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {flush,host} from './p2-host';

afterEach(()=>vi.unstubAllGlobals());
it('preserves synthetic attribution in web and offline metadata and credits',async()=>{
 const source=mkdtempSync(join(tmpdir(),'synthetic-source-')),target=mkdtempSync(join(tmpdir(),'synthetic-packed-'));
 const data=Buffer.from('sample bytes');const r={word:'receive',file:'receive.mp3',sha256:createHash('sha256').update(data).digest('hex'),accent:'us',kind:'synthetic',author:'Kokoro',license:'Apache-2.0',sourceUrl:'https://example.org/model',licenseUrl:'https://example.org/license'};
 writeFileSync(join(source,r.file),data);writeFileSync(join(source,'manifest.json'),JSON.stringify({version:1,entries:{receive:r}}));
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('receive','test')").run();const app=buildApp(db,{pronunciationDir:source});let local:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{
  expect((await app.inject('/api/pronunciation?word=receive')).json()).toMatchObject({status:'ready',kind:'synthetic'});
  const credits=(await app.inject('/api/pronunciation/credits?word=receive')).body;expect(credits).toContain('合成语音');expect(credits).not.toContain('这些英语发音来自真人录音');
  const packed=packPronunciations({version:1,entries:{receive:r}},source,target);expect(packed.credits).toContain('合成语音');
  local=await openBrowserDatabase(db.serialize());const runtime=createLocalRuntime({db:local,save:async()=>{},assetFetch:vi.fn(),recordings:packed.recordings,now:()=>new Date('2026-10-21T01:00:00Z')});
  expect(await(await runtime.fetch('/api/pronunciation?word=receive')).json()).toMatchObject({status:'ready',kind:'synthetic'});
 }finally{local?.close();await app.close();db.close();rmSync(source,{recursive:true,force:true});rmSync(target,{recursive:true,force:true});}
});
it('labels the same generated audio on the word page and sound-spelling panel',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({status:'ready',accent:'us',kind:'synthetic'})));
 const word=host('web/src/views/WordView.vue',{wordId:1,initial:{word:{id:1,headword:'receive',source:'test',phonetic:null,meaning_zh:null},status:'新词',statusDetail:{recognize:null,spell:null,dictation:null},wrong:null,content:{status:'pending',blocks:[]}}});
 const spelling=host('web/src/components/SoundSpellingLesson.vue',{lesson:getSoundSpellingLesson('receive'),recordingWord:'receive'});
 try{await flush();expect(word.text()).toContain('美式合成语音');expect(spelling.text()).toContain('美式合成语音');}finally{word.app.unmount();spelling.app.unmount();}
});
