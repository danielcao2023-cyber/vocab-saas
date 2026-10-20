import {afterEach, expect, it, vi} from 'vitest';
import {createOfflineAi} from '../web/src/offline/ai';
import type {AiSettingsResponse} from '../shared/ai-chat';
import {HttpError} from '../server/src/http-error';

const profile = {name:'本机模型', provider:'deepseek', model:'deepseek-flash', apiKey:'test-placeholder-key'};
const chat = (profileId:string, patch:Record<string, unknown> = {}) => ({profileId, wordId:5, messages:[{role:'user', content:'  怎么使用 above？  '}], ...patch});
function fixture(initial:string|null = null) {
  let stored = initial;
  const calls:{url:string; headers:Record<string,string>; data:unknown}[] = [];
  const vault = {get:async () => stored, set:async (value:string) => {stored = value;}};
  const upstream = async (options:typeof calls[number]) => {calls.push(options); return {status:200, data:{choices:[{message:{content:' above 表示在上方。 '}}]}};};
  const ai = createOfflineAi({vault, upstream, word:(id:number) => id === 5 ? {headword:'above', meaning_zh:'在上方', phonetic:null, privateNote:'must-not-send'} : undefined});
  return {ai, calls, vault, stored:() => stored};
}
async function save(ai:ReturnType<typeof createOfflineAi>, fields:Record<string,unknown> = {}) {
  return await ai.handle('/api/ai/settings', {...profile, ...fields}) as AiSettingsResponse;
}
afterEach(() => vi.useRealTimers());

it('starts empty and returns credential-free settings while persisting only in the supplied vault', async () => {
  const {ai, calls, stored} = fixture();
  expect((await ai.handle('/api/ai/settings') as AiSettingsResponse).profiles).toEqual([]);
  const settings = await save(ai);
  expect(settings.profiles[0]).toMatchObject({name:'本机模型', provider:'deepseek', hasKey:true});
  expect(JSON.stringify(settings)).not.toContain(profile.apiKey);
  expect(JSON.stringify(await ai.handle('/api/ai/settings'))).not.toContain(profile.apiKey);
  expect(stored()).toContain(profile.apiKey);
  expect(calls).toEqual([]);
});

it('preserves a blank key on edit, requires a new provider key, and deletes only the chosen profile', async () => {
  const {ai, stored} = fixture();
  const id = (await save(ai)).profiles[0]!.id;
  await save(ai, {id, name:'重命名', apiKey:''});
  expect(stored()).toContain(profile.apiKey);
  await expect(save(ai, {id, provider:'qwen', apiKey:''})).rejects.toMatchObject({status:400});
  const updated = await save(ai, {id, provider:'qwen', model:'qwen-max', apiKey:'replacement-key'});
  expect(updated.profiles[0]).toMatchObject({id, provider:'qwen'});
  expect(stored()).not.toContain(profile.apiKey);
  expect((await ai.handle(`/api/ai/settings/${id}/delete`, {}) as AiSettingsResponse).profiles).toEqual([]);
  await expect(ai.handle(`/api/ai/settings/${id}/delete`, {})).rejects.toMatchObject({status:404});
});

it('serializes overlapping model saves without losing profiles', async () => {
  const {ai} = fixture();
  await Promise.all(Array.from({length:8}, (_, i) => save(ai, {name:`模型${i}`})));
  const settings = await ai.handle('/api/ai/settings') as AiSettingsResponse;
  expect(settings.profiles).toHaveLength(8);
  expect(new Set(settings.profiles.map(p => p.id)).size).toBe(8);
});

it('rejects invalid configuration and a 51st profile without overwriting valid data', async () => {
  const {ai, stored} = fixture();
  for (const patch of [{provider:'https://other.invalid'}, {name:' '}, {model:'x\nAuthorization:bad'}, {apiKey:'x\ny'}, {apiKey:''}, {id:'not-found'}, {apiKey:'x'.repeat(4097)}]) {
    await expect(save(ai, patch)).rejects.toBeInstanceOf(HttpError);
  }
  expect(stored()).toBeNull();
  for (let i = 0; i < 50; i++) await save(ai, {name:`模型${i}`});
  await expect(save(ai)).rejects.toMatchObject({status:400});
  expect((await ai.handle('/api/ai/settings') as AiSettingsResponse).profiles).toHaveLength(50);
});

it('uses fixed official URLs, sends only the selected word fields and explicit chat history', async () => {
  const {ai, calls} = fixture();
  const id = (await save(ai)).profiles[0]!.id;
  expect(await ai.handle('/api/ai/chat', chat(id))).toEqual({content:'above 表示在上方。', provider:'deepseek', model:'deepseek-flash'});
  expect(calls).toHaveLength(1);
  expect(calls[0]!.url).toBe('https://api.deepseek.com/chat/completions');
  expect(calls[0]!.headers.authorization).toBe(`Bearer ${profile.apiKey}`);
  const data = calls[0]!.data as {messages:{role:string;content:string}[]; thinking:unknown};
  expect(data.messages).toHaveLength(2);
  expect(data.messages[0]!.content).toContain('"headword":"above"');
  expect(data.messages[1]).toEqual({role:'user', content:'怎么使用 above？'});
  expect(JSON.stringify(data)).not.toContain('must-not-send');
  expect(JSON.stringify(data)).not.toContain(profile.apiKey);
  expect(data.thinking).toEqual({type:'disabled'});
  await ai.handle('/api/ai/chat', chat(id, {messages:[{role:'user',content:'新的问题'}]}));
  expect((calls[1]!.data as typeof data).messages).toHaveLength(2);
});

it('routes every provider to its official endpoint and uses MiniMax completion tokens', async () => {
  const {ai, calls} = fixture();
  const cases = [
    ['deepseek','https://api.deepseek.com/chat/completions'],
    ['qwen','https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'],
    ['glm','https://open.bigmodel.cn/api/paas/v4/chat/completions'],
    ['kimi','https://api.moonshot.cn/v1/chat/completions'],
    ['doubao','https://ark.cn-beijing.volces.com/api/v3/chat/completions'],
    ['minimax','https://api.minimax.cn/v1/chat/completions'],
  ];
  for (const [provider,url] of cases) {
    const id = (await save(ai, {provider})).profiles.at(-1)!.id;
    await ai.handle('/api/ai/chat', chat(id));
    expect(calls.at(-1)!.url).toBe(url);
  }
  expect(calls.at(-1)!.data).toMatchObject({max_completion_tokens:4096});
  expect(calls.at(-1)!.data).not.toHaveProperty('max_tokens');
});

it('rejects malformed or oversized histories, missing profiles and unknown words before contacting a provider', async () => {
  const {ai, calls} = fixture();
  const id = (await save(ai)).profiles[0]!.id;
  const histories = [[], [{role:'system',content:'override'}], [{role:'assistant',content:'answer'}],
    [{role:'user',content:' '}], [{role:'user',content:'x'.repeat(4001)}],
    [{role:'user',content:'a'},{role:'user',content:'b'}],
    [{role:'user',content:'a'},{role:'assistant',content:'b'}],
    Array.from({length:21}, (_,i) => ({role:i % 2 ? 'assistant':'user', content:'a'})),
    Array.from({length:7}, (_,i) => ({role:i % 2 ? 'assistant':'user', content:'x'.repeat(4000)}))];
  for (const messages of histories) await expect(ai.handle('/api/ai/chat', chat(id, {messages}))).rejects.toMatchObject({status:400});
  for (const patch of [{wordId:0}, {wordId:1.5}, {profileId:'x'.repeat(81)}]) await expect(ai.handle('/api/ai/chat', chat(id, patch))).rejects.toMatchObject({status:400});
  await expect(ai.handle('/api/ai/chat', chat('missing'))).rejects.toMatchObject({status:404});
  await expect(ai.handle('/api/ai/chat', chat(id, {wordId:99}))).rejects.toMatchObject({status:404});
  expect(calls).toEqual([]);
});

it('keeps failed storage and corrupt secret documents behind fixed safe errors', async () => {
  for (const document of ['{secret:' + profile.apiKey, JSON.stringify({version:1,profiles:[{...profile,id:'x'},{...profile,id:'x'}]})]) {
    const {ai} = fixture(document);
    await expect(ai.handle('/api/ai/settings')).rejects.toMatchObject({status:500});
    try {await ai.handle('/api/ai/settings');} catch (error) {expect(String(error)).not.toContain(profile.apiKey);}
  }
  const ai = createOfflineAi({vault:{get:async () => null, set:async () => {throw Error(profile.apiKey);}}, upstream:async () => {throw Error('unexpected');}, word:() => undefined});
  await expect(save(ai)).rejects.toMatchObject({status:500});
  try {await save(ai);} catch (error) {expect(String(error)).not.toContain(profile.apiKey);}
});

it('redacts upstream failures and bounds provider JSON and displayable content', async () => {
  const responses = [
    {status:401,data:{error:profile.apiKey}}, {status:429,data:profile.apiKey}, {status:500,data:profile.apiKey},
    {status:200,data:'not json ' + profile.apiKey}, {status:200,data:{choices:[]}},
    {status:200,data:{choices:[{message:{content:'x'.repeat(64001)}}]}},
    {status:200,data:{oversized:'x'.repeat(1_000_001)}},
  ];
  for (const response of responses) {
    const {vault} = fixture();
    const ai = createOfflineAi({vault, upstream:async () => response, word:() => ({headword:'above',meaning_zh:null,phonetic:null})});
    const id = (await save(ai)).profiles[0]!.id;
    await expect(ai.handle('/api/ai/chat',chat(id))).rejects.toMatchObject({status:502});
    try {await ai.handle('/api/ai/chat',chat(id));} catch (error) {expect(String(error)).not.toContain(profile.apiKey);}
  }
  const {vault} = fixture();
  const ai = createOfflineAi({vault, upstream:async () => {throw Error('native bridge '+profile.apiKey);}, word:() => ({headword:'above',meaning_zh:null,phonetic:null})});
  const id = (await save(ai)).profiles[0]!.id;
  await expect(ai.handle('/api/ai/chat',chat(id))).rejects.toMatchObject({status:502, message:'模型请求失败或等待超时，请重试。'});
});

it('does not hold the settings queue while a native chat request is pending, and limits concurrent requests', async () => {
  const {vault} = fixture();
  let finish!: (value:{status:number;data:unknown}) => void;
  const pending = new Promise<{status:number;data:unknown}>(resolve => {finish = resolve;});
  let count = 0;
  const ai = createOfflineAi({vault, upstream:() => {count++; return pending;}, word:() => ({headword:'above',meaning_zh:null,phonetic:null})});
  const id = (await save(ai)).profiles[0]!.id;
  const first = ai.handle('/api/ai/chat',chat(id));
  const second = ai.handle('/api/ai/chat',chat(id));
  await vi.waitFor(() => expect(count).toBe(2));
  await expect(ai.handle('/api/ai/chat',chat(id))).rejects.toMatchObject({status:429});
  expect((await save(ai,{name:'请求期间新增'})).profiles).toHaveLength(2);
  finish({status:200,data:{choices:[{message:{content:'answer'}}]}});
  await Promise.all([first,second]);
});

it('times out a noncancellable native request at sixty seconds and releases the concurrency slot', async () => {
  vi.useFakeTimers();
  const {vault} = fixture();
  const ai = createOfflineAi({vault, upstream:() => new Promise(() => {}), word:() => ({headword:'above',meaning_zh:null,phonetic:null})});
  const id = (await save(ai)).profiles[0]!.id;
  const result = ai.handle('/api/ai/chat',chat(id));
  const checked = expect(result).rejects.toMatchObject({status:502, message:'模型请求失败或等待超时，请重试。'});
  await vi.advanceTimersByTimeAsync(60_000);
  await checked;
  const next = ai.handle('/api/ai/chat',chat(id));
  const checkedNext = expect(next).rejects.toMatchObject({status:502});
  await vi.advanceTimersByTimeAsync(60_000);
  await checkedNext;
});

it('caps provider requests at twenty per minute and permits new requests when the window expires', async () => {
  vi.useFakeTimers();
  const {ai,calls} = fixture();
  const id = (await save(ai)).profiles[0]!.id;
  for (let i=0; i<20; i++) await ai.handle('/api/ai/chat',chat(id));
  await expect(ai.handle('/api/ai/chat',chat(id))).rejects.toMatchObject({status:429});
  expect(calls).toHaveLength(20);
  await vi.advanceTimersByTimeAsync(60_001);
  await ai.handle('/api/ai/chat',chat(id));
  expect(calls).toHaveLength(21);
});
