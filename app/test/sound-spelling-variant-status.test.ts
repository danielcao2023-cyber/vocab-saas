import {readFileSync} from 'node:fs';
import {afterEach,expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
const entries=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries;
afterEach(()=>vi.unstubAllGlobals());
it.each(['noun','verb'])('distinguishes real import %s playback from the default audio metadata',async variant=>{
 const info=entries.import;vi.stubGlobal('fetch',vi.fn(async()=>Response.json({status:'ready',accent:info.accent,ipa:info.ipa,pronunciationNote:info.pronunciationNote})));const ui=host('web/src/components/SoundSpellingLesson.vue',{lesson:getSoundSpellingLesson('import'),recordingWord:'import',playback:{word:'import',source:'recording',variant}});
 try{await flush();expect(ui.text()).toContain('刚播放所选读音');expect(ui.text()).toContain('下方音形对照请参照其标注音标');expect(ui.text(ui.all(n=>n.props['aria-label']==='当前整词录音说明')[0])).not.toContain(info.ipa);ui.updateProps({playback:{word:'import',source:'recording'}});await flush();expect(ui.text()).toContain(info.ipa);expect(ui.text()).not.toContain('刚播放所选读音');}finally{ui.app.unmount();}
});
it('does not carry another word’s variant or a failed selection into the current panel',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({status:'ready',accent:'uk',ipa:'/default/'})));const ui=host('web/src/components/SoundSpellingLesson.vue',{lesson:getSoundSpellingLesson('import'),recordingWord:'import',playback:{word:'other',source:'recording',variant:'noun'}});
 try{await flush();expect(ui.text()).toContain('/default/');expect(ui.text()).not.toContain('刚播放所选读音');ui.updateProps({playback:{word:'import',source:'failed',variant:'noun'}});await flush();expect(ui.text()).not.toContain('/default/');expect(ui.text()).not.toContain('刚播放所选读音');ui.updateProps({playback:{word:'import',source:'system'}});await flush();expect(ui.text()).toContain('系统合成发音');}finally{ui.app.unmount();}
});
it('ignores a late metadata response for a previous selected word',async()=>{
 let resolveOld!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn((url:string)=>url.includes('word=import')?new Promise<Response>(resolve=>{resolveOld=resolve}):Promise.resolve(Response.json({status:'ready',ipa:'/new-word/'}))));const ui=host('web/src/components/SoundSpellingLesson.vue',{lesson:getSoundSpellingLesson('import'),recordingWord:'import'});
 try{await flush();ui.updateProps({recordingWord:'other'});await flush();expect(ui.text()).toContain('/new-word/');resolveOld(Response.json({status:'ready',ipa:'/old-word/'}));await flush();expect(ui.text()).toContain('/new-word/');expect(ui.text()).not.toContain('/old-word/');}finally{ui.app.unmount();}
});
it('real import variants and their distinct recordings survive offline packaging',async()=>{
 const {mkdtempSync,rmSync,readFileSync:read}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {createHash}=await import('node:crypto');const {packPronunciations}=await import('../scripts/mobile-pronunciation-assets');const dir=mkdtempSync(join(tmpdir(),'variant-import-'));
 try{const r=packPronunciations({version:1,entries:{import:entries.import}},'data/pronunciation',dir).recordings.import;for(const v of ['noun','verb'] as const){expect(r.variants[v].ipa).toBe(entries.import.variants[v].ipa);expect(createHash('sha256').update(read(join(dir,entries.import.variants[v].file))).digest('hex')).toBe(entries.import.variants[v].sha256);}expect(r.variants.noun.ipa).not.toBe(r.variants.verb.ipa);}finally{rmSync(dir,{recursive:true,force:true});}
});
it('does not claim the complex spelling map is the default recording when their vowel differs',async()=>{
 const info=entries.complex;expect(info.ipa).toBe('/kəmˈplɛks/');const lesson=getSoundSpellingLesson('complex')!;expect(lesson.ipa).toBe('/kɑːmˈpleks/');
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({status:'ready',ipa:info.ipa})));const ui=host('web/src/components/SoundSpellingLesson.vue',{lesson,recordingWord:'complex',playback:{word:'complex',source:'recording',variant:'noun'}});
 try{await flush();expect(ui.text()).toContain('刚播放所选读音');expect(ui.text()).toContain('下方音形对照请参照其标注音标');expect(ui.text()).not.toContain('下方音形对照为默认读音');expect(ui.text()).toContain('/kɑːmˈpleks/')}finally{ui.app.unmount()}
});
it('hides recording source during pending and failed fallback and restores it for real audio',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({status:'ready',accent:'us',pronunciationNote:'原真人来源'})));const ui=host('web/src/components/SoundSpellingLesson.vue',{lesson:getSoundSpellingLesson('import'),recordingWord:'import'});
 try{await flush();expect(ui.text()).toContain('原真人来源');for(const source of ['pending','failed']){ui.updateProps({playback:{word:'import',source}});await flush();expect(ui.text()).not.toContain('原真人来源');expect(ui.text()).not.toContain('录音来源')}ui.updateProps({playback:{word:'import',source:'system'}});await flush();expect(ui.text()).toContain('系统合成发音');expect(ui.text()).not.toContain('原真人来源');ui.updateProps({playback:{word:'import',source:'recording'}});await flush();expect(ui.text()).toContain('原真人来源')}finally{ui.app.unmount()}
});
