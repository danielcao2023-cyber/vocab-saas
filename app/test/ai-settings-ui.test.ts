import {afterEach,expect,it,vi} from 'vitest';
import {AI_PROVIDERS} from '../shared/ai-chat';
import {host,flush} from './p2-host';
afterEach(()=>vi.unstubAllGlobals());

it('submits a new configuration but clears the password and never stores it in browser storage',async()=>{
  const saved={providers:AI_PROVIDERS,profiles:[{id:'test-id',provider:'deepseek',model:'deepseek-flash',name:'学习模型',hasKey:true}]};
  const fetch=vi.fn(async(_url:string,_options?:RequestInit)=>new Response(JSON.stringify(saved)));vi.stubGlobal('fetch',fetch);
  const onSaved=vi.fn(),ui=host('web/src/components/AiModelSettings.vue',{initial:{providers:AI_PROVIDERS,profiles:[]},onSaved});
  try {
    const field=(name:string)=>ui.all(n=>n.props['aria-label']===name&&['input','select'].includes(n.tag))[0];
    field('显示名称').props['onUpdate:modelValue']('学习模型');
    field('API Key').props['onUpdate:modelValue']('test-only-ui-key');await flush();
    ui.all(n=>n.tag==='form')[0].props.onSubmit({preventDefault(){}});await flush();
    expect(fetch).toHaveBeenCalledOnce();
    const body=JSON.parse(fetch.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({name:'学习模型',provider:'deepseek',model:'deepseek-flash',apiKey:'test-only-ui-key'});
    expect(ui.text()).not.toContain('test-only-ui-key');
    expect(field('API Key').value).toBe('');expect(ui.storage.size).toBe(0);
    expect(onSaved).toHaveBeenCalled();
  } finally {ui.app.unmount();}
});

it('clears a typed key when choosing a different provider',async()=>{
  const ui=host('web/src/components/AiModelSettings.vue',{initial:{providers:AI_PROVIDERS,profiles:[]}});
  try {
    const fields=()=>ui.all(n=>['input','select'].includes(n.tag));
    fields().find(n=>n.props['aria-label']==='API Key')!.props['onUpdate:modelValue']('test-old-provider-key');
    const provider=fields().find(n=>n.props['aria-label']==='服务商')!;
    provider.props['onUpdate:modelValue']('qwen');provider.props.onChange({target:{value:'qwen'}});await flush();
    expect(fields().find(n=>n.props['aria-label']==='API Key')!.value).toBe('');
    expect(fields().find(n=>n.props['aria-label']==='模型 ID')!.value).toBe(AI_PROVIDERS[1].defaultModel);
  } finally {ui.app.unmount();}
});

it('allows closing while a settings read is pending',async()=>{
  vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(()=>{})));
  const close=vi.fn(),ui=host('web/src/components/AiModelSettings.vue',{onClose:close});
  try{await flush();ui.all(n=>n.props['aria-label']==='关闭设置')[0].props.onClick();expect(close).toHaveBeenCalledOnce();}finally{ui.app.unmount();}
});
