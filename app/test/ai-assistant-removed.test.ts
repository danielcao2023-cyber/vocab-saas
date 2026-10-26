import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';

const requests=[
 {method:'GET' as const,path:'/api/ai/settings'},
 {method:'POST' as const,path:'/api/ai/settings'},
 {method:'POST' as const,path:'/api/ai/settings/old-model/delete'},
 {method:'POST' as const,path:'/api/ai/chat'},
];

it('retires the web assistant endpoints without loading or changing legacy model settings',async()=>{
 const db=openDb(':memory:'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-retired-chat-')),file=path.join(dir,'legacy-models.json');
 // Deliberately invalid legacy contents: removed routes must not try to read them.
 fs.writeFileSync(file,'legacy-settings-not-to-be-read');const before=fs.readFileSync(file);
 const upstream=vi.fn(()=>{throw new Error('Unexpected model request');});
 const legacyOptions={aiConfigPath:file,aiFetch:upstream};
 const app=buildApp(db,{...legacyOptions,staticDir:dir});
 try{
  for(const req of requests){const res=await app.inject({method:req.method,url:req.path,...(req.method==='POST'?{payload:{}}:{})});expect(res.statusCode,req.path).toBe(404);expect(res.headers['content-type']).toContain('application/json');}
  expect(upstream).not.toHaveBeenCalled();expect(fs.readFileSync(file)).toEqual(before);
  expect((await app.inject('/health')).statusCode).toBe(200);
 }finally{await app.close();db.close();fs.rmSync(dir,{recursive:true,force:true});}
});

it('retires offline assistant endpoints without calling a model or writing the learning snapshot',async()=>{
 const source=openDb(':memory:'),db=await openBrowserDatabase(source.serialize());source.close();
 const save=vi.fn(async()=>{}),assets=vi.fn(),handler=vi.fn(async()=>({profiles:[]}));
 const legacyOptions={ai:{handle:handler}};
 const runtime=createLocalRuntime({...legacyOptions,db,save,assetFetch:assets,recordings:{}});
 try{
  for(const req of requests){const res=await runtime.fetch(req.path,{method:req.method,...(req.method==='POST'?{body:'{}'}:{})});expect(res.status,req.path).toBe(404);}
  expect(handler).not.toHaveBeenCalled();expect(assets).not.toHaveBeenCalled();expect(save).not.toHaveBeenCalled();
  expect((await runtime.fetch('/health')).status).toBe(200);
 }finally{db.close();}
});
