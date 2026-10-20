import {afterEach,expect,it,vi} from 'vitest';
import {AI_PROVIDERS} from '../shared/ai-chat';
import {host,flush} from './p2-host';
const settings={providers:AI_PROVIDERS,profiles:[{id:'model-a',name:'学习模型',provider:'deepseek',model:'deepseek-flash',hasKey:true},{id:'model-b',name:'备用模型',provider:'qwen',model:'qwen3.8-max',hasKey:true}]};
afterEach(()=>vi.unstubAllGlobals());
function setup(){const ui=host('web/src/components/WordAiChat.vue',{wordId:5,headword:'above',initialSettings:settings});const button=(t:string)=>ui.all(n=>n.tag==='button'&&ui.text(n).trim()===t)[0];const input=()=>ui.all(n=>n.tag==='textarea')[0];return {ui,button,input};}
it('keeps alternating messages, renders model output as text and excludes keys from requests',async()=>{
 const fetch=vi.fn(async()=>new Response(JSON.stringify({content:'<img src=x onerror=alert(1)>',provider:'deepseek',model:'deepseek-flash'})));vi.stubGlobal('fetch',fetch);
 const {ui,button,input}=setup();try{await flush();expect(fetch).not.toHaveBeenCalled();
 input().props['onUpdate:modelValue']('解释 above');await flush();await button('发送').props.onClick();await flush();
 expect(JSON.parse((fetch.mock.calls[0] as unknown as [string,RequestInit])[1].body as string)).toMatchObject({profileId:'model-a',wordId:5,messages:[{role:'user',content:'解释 above'}]});
 expect(ui.all(n=>n.tag==='img')).toHaveLength(0);expect(ui.text()).toContain('<img src=x');
 input().props['onUpdate:modelValue']('再举例');await flush();await button('发送').props.onClick();await flush();
 expect(ui.all(n=>n.props.role==='article').map(n=>ui.text(n))).toEqual(['我解释 above','AI<img src=x onerror=alert(1)>','我再举例','AI<img src=x onerror=alert(1)>']);
 expect(ui.storage.size).toBe(0);
 }finally{ui.app.unmount();}
});
it('retries failed questions once without duplicating history',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({error:'服务商暂时限流'}),{status:502})).mockResolvedValueOnce(new Response(JSON.stringify({content:'回复'})));vi.stubGlobal('fetch',fetch);
 const {ui,button,input}=setup();try{await flush();input().props['onUpdate:modelValue']('用法');await flush();await button('发送').props.onClick();await flush();expect(input().value).toBe('用法');
 await button('重试').props.onClick();await flush();expect(fetch).toHaveBeenCalledTimes(2);expect(ui.all(n=>n.props.role==='article')).toHaveLength(2);
 const body=JSON.parse(fetch.mock.calls[1][1].body);expect(body.messages).toEqual([{role:'user',content:'用法'}]);
 }finally{ui.app.unmount();}
});
it('rejects late responses after stopping, switching word or switching model',async()=>{
 let resolve!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>resolve=r)));
 const {ui,button,input}=setup();try{await flush();input().props['onUpdate:modelValue']('等一下');await flush();const pending=button('发送').props.onClick();await flush();button('停止').props.onClick();resolve(new Response(JSON.stringify({content:'迟到的回复'})));await pending;await flush();expect(ui.text()).not.toContain('迟到的回复');
 input().props['onUpdate:modelValue']('换词');await flush();const second=button('发送').props.onClick();await flush();ui.updateProps({wordId:6,headword:'abroad'});await flush();resolve(new Response(JSON.stringify({content:'旧词回复'})));await second;await flush();expect(ui.text()).not.toContain('旧词回复');expect(input().value).toBe('');
 const select=ui.all(n=>n.props['aria-label']==='对话模型')[0];select.props.onChange({target:{value:'model-b'}});await flush();expect(select.value).toBe('model-b');
 }finally{ui.app.unmount();}
});
it('can recover settings after an initial read failure and ignores a stale initial read',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(new Response('{}',{status:500})).mockResolvedValueOnce(new Response(JSON.stringify(settings)));
 vi.stubGlobal('fetch',fetch);
 const ui=host('web/src/components/WordAiChat.vue',{wordId:5,headword:'above'});
 try{await flush();ui.all(n=>n.tag==='button'&&ui.text(n).trim()==='模型设置')[0].props.onClick();await flush();expect(ui.text()).toContain('学习模型');expect(fetch).toHaveBeenCalledTimes(2);}finally{ui.app.unmount();}
 const resolves:((r:Response)=>void)[]=[];
 const waiting=vi.fn(()=>new Promise<Response>(r=>resolves.push(r)));vi.stubGlobal('fetch',waiting);
 const second=host('web/src/components/WordAiChat.vue',{wordId:5,headword:'above'});
 try{await flush();second.all(n=>n.tag==='button'&&second.text(n).trim()==='模型设置')[0].props.onClick();await flush();
 resolves[1](new Response(JSON.stringify(settings)));await flush();
 resolves[0](new Response(JSON.stringify({providers:AI_PROVIDERS,profiles:[]})));await flush();
 expect(second.all(n=>n.props['aria-label']==='对话模型')[0].value).toBe('model-a');
 }finally{second.app.unmount();}
});
