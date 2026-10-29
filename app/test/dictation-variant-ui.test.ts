import {afterEach,expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
import {mockAudio,MockAudio} from './audio-fixtures';
import {applyPreferences} from '../web/src/preferences';
import {DEFAULT_PREFERENCES} from '../shared/preferences';
import {stopAudio} from '../web/src/audio';
import path from 'node:path';
afterEach(()=>{stopAudio();applyPreferences(DEFAULT_PREFERENCES);vi.unstubAllGlobals()});
it('uses bound recording for both autoplay and a retry without revealing its sense',async()=>{
 mockAudio();applyPreferences({...DEFAULT_PREFERENCES,dictationAutoPlay:true});
 const card={issueId:'i',wordId:1,mode:'dictation',audioWord:'bow',audioVariant:'noun',patterns:['___'],options:[],assisted:false};
 const summary={total:1,touched:0};
 vi.stubGlobal('fetch',async(path:string)=>Response.json(path==='/api/learning/next'?{kind:'card',policyVersion:3,summary,card}:summary));
 const ui=host('web/src/views/LearningStudyView.vue');try{
  await flush();expect(MockAudio.instances[0].src).toBe('/api/pronunciation/audio?word=bow&variant=noun');
  MockAudio.instances[0].emit('error');await flush();expect(ui.text()).toContain('暂缓此词');expect(ui.text()).not.toContain('名词');
  const retry=ui.all(n=>n.tag==='button'&&ui.text(n)==='重试播放')[0];retry.props.onClick();expect(MockAudio.instances[1].src).toBe('/api/pronunciation/audio?word=bow&variant=noun');
 }finally{ui.app.unmount()}
});
it.each(['bow','contract'])('manual %s playback reports a failed selected recording without misleading TTS advice',async word=>{
 mockAudio();applyPreferences({...DEFAULT_PREFERENCES,dictationAutoPlay:false});
 const card={issueId:'i',wordId:1,mode:'dictation',audioWord:word,audioVariant:'noun',patterns:['___'],options:[],assisted:false},summary={total:1,touched:0};
 vi.stubGlobal('fetch',async(path:string)=>Response.json(path==='/api/learning/next'?{kind:'card',policyVersion:3,summary,card}:summary));
 const ui=host('web/src/views/LearningStudyView.vue',{}, {[path.resolve('web/src/preferences.ts')]:{preferences:{...DEFAULT_PREFERENCES,dictationAutoPlay:false}}});try{await flush();expect(MockAudio.instances).toHaveLength(0);
 const button=ui.all(n=>n.tag==='button'&&n.props['aria-label']==='听发音')[0];expect(button).toBeDefined();button.props.onClick();expect(MockAudio.instances[0].src).toBe(`/api/pronunciation/audio?word=${word}&variant=noun`);MockAudio.instances[0].emit('error');await flush();expect(ui.text()).not.toContain('请确认设备已安装英文语音');expect(ui.text()).toContain('暂缓此词');
 }finally{ui.app.unmount()}
});
