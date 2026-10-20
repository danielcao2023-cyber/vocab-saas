import {afterEach,expect,it} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createChatConfig} from '../server/src/chat-config';

const roots:string[]=[];
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-chat-'));roots.push(dir);return {dir,file:path.join(dir,'private','ai-models.json')};}
afterEach(()=>{for(const dir of roots.splice(0))fs.rmSync(dir,{recursive:true,force:true});});
const input={name:'我的 DeepSeek',provider:'deepseek',model:'deepseek-flash',apiKey:'test-only-placeholder-key'} as const;

it('stores keys with restricted permissions and returns only safe metadata',()=>{
  const {file}=fixture(),store=createChatConfig(file);
  expect(store.list().profiles).toEqual([]);expect(fs.existsSync(file)).toBe(false);
  const saved=store.save(input),profile=saved.profiles[0];
  expect(profile).toMatchObject({name:input.name,model:'deepseek-flash',hasKey:true});
  expect(JSON.stringify(saved)).not.toContain(input.apiKey);
  expect(fs.statSync(file).mode&0o777).toBe(0o600);
  expect(createChatConfig(file).credential(profile.id).apiKey).toBe(input.apiKey);
});

it('preserves a blank edit key, requires a fresh key when changing provider, and deletes profiles',()=>{
  const {file}=fixture(),store=createChatConfig(file),id=store.save(input).profiles[0].id;
  store.save({...input,id,name:'重命名',apiKey:''});
  expect(store.credential(id).apiKey).toBe(input.apiKey);
  expect(()=>store.save({...input,id,provider:'qwen',apiKey:''})).toThrow();
  expect(store.credential(id).provider).toBe('deepseek');
  expect(store.remove(id).profiles).toEqual([]);
  expect(()=>store.credential(id)).toThrow();
});

it('rejects unrecognized destinations, malformed model names, and corrupt secret files without leaking data',()=>{
  const {file}=fixture(),store=createChatConfig(file);
  for(const patch of [{provider:'http://127.0.0.1'},{model:'x\nAuthorization:bad'},{apiKey:''}])expect(()=>store.save({...input,...patch})).toThrow();
  expect(fs.existsSync(file)).toBe(false);
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'{"private":"secret-value"');
  try{store.list();throw new Error('expected failure');}catch(e){expect(String(e)).not.toContain('secret-value');}
});
