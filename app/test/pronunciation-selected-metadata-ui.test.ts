import {afterEach,expect,it,vi} from 'vitest';
import {mockAudio,MockAudio} from './audio-fixtures';
import {flush,host} from './p2-host';

afterEach(()=>vi.unstubAllGlobals());
it('shows the selected variant IPA and description instead of default recording metadata',async()=>{
 mockAudio();
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>Response.json(url.includes('/api/pronunciation?')?{status:'ready',ipa:'/default/',pronunciationNote:'默认读音',variants:[{variant:'noun',label:'名词',ipa:'/noun/',pronunciationNote:'名词读音'},{variant:'verb',label:'动词',pronunciationNote:'动词读音'}]}:{status:'missing'})));
 const ui=host('web/src/views/WordView.vue',{wordId:1,initial:{word:{id:1,headword:'estimate',source:'test',phonetic:null,meaning_zh:null},status:'新词',statusDetail:{recognize:null,spell:null,dictation:null},wrong:null,content:{status:'pending',blocks:[]}}});
 try{
  await flush();
  const phon=()=>ui.text(ui.all(n=>n.props.class==='phon')[0]);
  const note=()=>ui.text(ui.all(n=>n.props['aria-label']==='发音说明')[0]);
  expect(phon()).toBe('/default/');expect(note()).toContain('默认读音');
  ui.all(n=>n.tag==='button'&&ui.text(n).includes('名词'))[0].props.onClick();await flush();
  MockAudio.instances[0].emit('playing');MockAudio.instances[0].emit('ended');await flush();
  expect(phon()).toBe('/noun/');expect(note()).toContain('名词读音');expect(note()).not.toContain('默认读音');
  ui.all(n=>n.tag==='button'&&ui.text(n).includes('动词'))[0].props.onClick();await flush();
  MockAudio.instances[1].emit('playing');MockAudio.instances[1].emit('ended');await flush();
  expect(ui.all(n=>n.props.class==='phon')).toHaveLength(0);expect(note()).toContain('动词读音');
  ui.all(n=>n.props['aria-label']==='听发音')[0].props.onClick();await flush();
  MockAudio.instances[2].emit('playing');MockAudio.instances[2].emit('ended');await flush();
  expect(phon()).toBe('/default/');expect(note()).toContain('默认读音');
 }finally{ui.app.unmount();}
});
