import {afterEach,expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
const data={preferences:{dailyWordLimit:40,playbackRate:1,dictationAutoPlay:true},activeDailyWordLimit:40,dailyLimitEffectiveOn:null,wordCount:1600};
afterEach(()=>vi.unstubAllGlobals());
it('retains a failed settings request, blocks close, and retries exactly the same preferences',async()=>{
 let fail=true;const bodies:unknown[]=[];
 vi.stubGlobal('fetch',async(path:string,init?:RequestInit)=>{if(path==='/version')return Response.json({commit:'test-version'});if(init?.method==='POST'){bodies.push(JSON.parse(String(init.body)));if(fail)return Response.json({error:'disk full'},{status:503});return Response.json({...data,preferences:bodies[0]});}return Response.json(data);});
 const close=vi.fn(),ui=host('web/src/components/SettingsPanel.vue',{onClose:close});
 try{
  await flush();ui.all(n=>n.props.id==='daily-word-limit')[0].props['onUpdate:modelValue'](20);
  await ui.all(n=>n.tag==='form')[0].props.onSubmit({preventDefault(){}});await flush();
  const button=()=>ui.all(n=>n.props['aria-label']==='关闭设置')[0];expect(button().props.disabled).toBe(true);button().props.onClick();expect(close).not.toHaveBeenCalled();expect(ui.all(n=>n.tag==='fieldset')[0].props.disabled).toBe(true);
  fail=false;await ui.all(n=>n.tag==='form')[0].props.onSubmit({preventDefault(){}});await flush();expect(bodies).toEqual([{dailyWordLimit:20,playbackRate:1,dictationAutoPlay:true},{dailyWordLimit:20,playbackRate:1,dictationAutoPlay:true}]);expect(button().props.disabled).toBe(false);expect(ui.text()).toContain('设置已保存');
 }finally{ui.app.unmount();}
});
