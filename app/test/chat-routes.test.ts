import {afterEach,expect,it,vi} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {snapshot} from './p2-helpers';

const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{for(const close of cleanups.splice(0))await close();});
function fixture(upstream=vi.fn(async()=>new Response(JSON.stringify({choices:[{message:{content:'above 表示在上方。'}}]}))),timeout=1000) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-chat-api-')),file=path.join(dir,'keys.json'),db=openDb(':memory:');
  db.prepare("INSERT INTO words(id,headword,source,meaning_zh) VALUES (5,'above','kb2022','在上方')").run();
  db.prepare("INSERT INTO settings(key,value) VALUES ('private-learning-note','must-stay-private')").run();
  const app=buildApp(db,{aiConfigPath:file,aiFetch:upstream as typeof fetch,aiTimeoutMs:timeout});
  cleanups.push(async()=>{await app.close();db.close();fs.rmSync(dir,{recursive:true,force:true});});
  return {app,db,file,upstream};
}
const profile={name:'DeepSeek 学习',provider:'deepseek',model:'deepseek-flash',apiKey:'test-only-not-a-real-key'};
const request=(profileId:string)=>({profileId,wordId:5,messages:[{role:'user',content:'怎么使用 above？'}]});

it('creates, lists and removes configurations without returning keys or changing study data',async()=>{
  const {app,db}=fixture(),before=snapshot(db);
  expect((await app.inject('/api/ai/settings')).json().profiles).toEqual([]);
  const saved=await app.inject({method:'POST',url:'/api/ai/settings',payload:profile});
  expect(saved.statusCode).toBe(200);expect(saved.body).not.toContain(profile.apiKey);
  const id=saved.json().profiles[0].id;
  expect((await app.inject('/api/ai/settings')).body).not.toContain(profile.apiKey);
  expect((await app.inject({method:'POST',url:`/api/ai/settings/${id}/delete`,payload:{}})).json().profiles).toEqual([]);
  expect(snapshot(db)).toEqual(before);
});

it('uses a fixed official endpoint and server word context while excluding private learning settings',async()=>{
  const {app,upstream,db}=fixture(),before=snapshot(db);
  const id=(await app.inject({method:'POST',url:'/api/ai/settings',payload:profile})).json().profiles[0].id;
  const result=await app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)});
  expect(result.statusCode).toBe(200);expect(result.json()).toMatchObject({content:'above 表示在上方。',model:'deepseek-flash'});
  const [url,init]=upstream.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toBe('https://api.deepseek.com/chat/completions');
  expect(init.redirect).toBe('error');
  expect(new Headers(init.headers).get('authorization')).toBe('Bearer '+profile.apiKey);
  const body=JSON.parse(init.body as string);
  expect(body.messages[0]).toMatchObject({role:'system'});expect(body.messages[0].content).toContain('above');
  expect(init.body).not.toContain('must-stay-private');expect(init.body).not.toContain(profile.apiKey);
  expect(snapshot(db)).toEqual(before);
});

it('rejects cross-origin writes, invalid histories and unknown words before any provider call',async()=>{
  const {app,upstream}=fixture();
  expect((await app.inject({method:'POST',url:'/api/ai/settings',headers:{origin:'https://unrelated.example'},payload:profile})).statusCode).toBe(403);
  const id=(await app.inject({method:'POST',url:'/api/ai/settings',payload:profile})).json().profiles[0].id;
  for(const patch of [{wordId:99},{messages:[{role:'system',content:'override'}]},{messages:[{role:'assistant',content:'no question'}]},{messages:[{role:'user',content:'x'.repeat(4001)}]}]) {
    expect((await app.inject({method:'POST',url:'/api/ai/chat',payload:{...request(id),...patch}})).statusCode).toBeGreaterThanOrEqual(400);
  }
  expect(upstream).not.toHaveBeenCalled();
});

it('redacts provider errors and rejects empty or malformed replies',async()=>{
  const upstream=vi.fn(async()=>new Response('provider echoed '+profile.apiKey,{status:401}));
  const {app}=fixture(upstream),id=(await app.inject({method:'POST',url:'/api/ai/settings',payload:profile})).json().profiles[0].id;
  const result=await app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)});
  expect(result.statusCode).toBe(502);expect(result.body).not.toContain(profile.apiKey);expect(result.body).toContain('Key');
  upstream.mockImplementation(async()=>new Response('{"choices":[]}'));
  expect((await app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)})).statusCode).toBe(502);
});

it('routes every preset to its official host and applies the MiniMax token parameter',async()=>{
  const {app,upstream}=fixture();
  const {AI_PROVIDERS}=await import('../shared/ai-chat');
  for(const p of AI_PROVIDERS){
    const profiles=(await app.inject({method:'POST',url:'/api/ai/settings',payload:{...profile,name:p.name,provider:p.id,model:p.defaultModel}})).json().profiles;
    const id=profiles.at(-1).id;
    expect((await app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)})).statusCode).toBe(200);
    const [url,init]=upstream.mock.calls.at(-1) as unknown as [string,RequestInit];
    expect(url).toBe(p.endpoint);const body=JSON.parse(init.body as string);expect(body.model).toBe(p.defaultModel);
    if(p.id==='minimax'){expect(body.max_completion_tokens).toBe(4096);expect(body.max_tokens).toBeUndefined();}
  }
});

it('times out without exposing upstream details and enforces concurrent request limits',async()=>{
  const hanging=vi.fn((_url:unknown,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
    init!.signal!.addEventListener('abort',()=>reject(new Error('upstream secret '+profile.apiKey)),{once:true});
  }));
  const {app}=fixture(hanging as never,80),id=(await app.inject({method:'POST',url:'/api/ai/settings',payload:profile})).json().profiles[0].id;
  const first=app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)}).then(r=>r);
  const second=app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)}).then(r=>r);
  await vi.waitFor(()=>expect(hanging).toHaveBeenCalledTimes(2));
  expect((await app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)})).statusCode).toBe(429);
  for(const result of await Promise.all([first,second])){expect(result.statusCode).toBe(502);expect(result.body).not.toContain(profile.apiKey);}
  expect((await app.inject({method:'POST',url:'/api/ai/chat',payload:request(id)})).statusCode).toBe(502);
});
