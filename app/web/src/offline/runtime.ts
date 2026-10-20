import {CapacitorHttp,Capacitor} from '@capacitor/core';
import {openBrowserDatabase,asSharedDb,type BrowserDatabase} from './sqlite';
import {learningToday,startLearning,nextLearning,answerLearning,consultLearning,deferLearning,learningBooks} from '../../../server/src/learning/engine';
import {search,wordDetail,browse} from '../../../server/src/search';
import {streak,makeup,parentSummary,curriculumProgress} from '../../../server/src/stats';
import {progress,wrongSummary,setWrong} from '../../../server/src/study';
import {getContent,contentFeedback} from '../../../server/src/content';
import {HttpError,parseId} from '../../../server/src/http-error';
import {createOfflineAi} from './ai';
import {learningStorage,profileVault} from './storage';
import {setMobileRecordings,type BundledRecording} from './mobile-mode';
import type {LearningAnswer,WordBook} from '../../../shared/learning';

const jsonResponse=(value:unknown,options:ResponseInit={})=>new Response(JSON.stringify(value),{...options,headers:{'content-type':'application/json; charset=utf-8',...options.headers}});

interface Options {db:BrowserDatabase;save:(bytes:Uint8Array)=>Promise<void>;assetFetch:typeof fetch;recordings:Record<string,BundledRecording>;now?:()=>Date;ai?:ReturnType<typeof createOfflineAi>}
export function createLocalRuntime(options:Options){
 const {db,assetFetch,recordings}=options,shared=asSharedDb(db),now=options.now??(()=>new Date());
 let queue:Promise<unknown>=Promise.resolve();
 const dispatch=async(url:URL,method:string,body:any):Promise<unknown>=>{
  const path=url.pathname,q=Object.fromEntries(url.searchParams),t=now();
  if(path==='/health')return {ok:true,offline:true,words:db.prepare('SELECT COUNT(*) n FROM words').get()?.n};
  if(path==='/version')return {commit:'android-1.0.1',offline:true};
  if(path==='/api/learning/today'&&method==='GET')return learningToday(shared,t);
  if(path==='/api/learning/start'&&method==='POST')return startLearning(shared,t);
  if(path==='/api/learning/next'&&method==='GET')return nextLearning(shared,t);
  if(path==='/api/learning/answer'&&method==='POST')return answerLearning(shared,body as LearningAnswer,t);
  if(path==='/api/learning/consult'&&method==='POST')return consultLearning(shared,body?.issueId,t);
  if(path==='/api/learning/defer'&&method==='POST')return deferLearning(shared,body?.issueId,t);
  if(path==='/api/learning/books'&&method==='GET')return learningBooks(shared,(q.book??'unfamiliar') as WordBook,parseId(q.page??'1','page'),t);
  if(path==='/api/search'&&method==='GET'){const limit=parseId(q.limit??'20','limit');if(limit>100)throw new HttpError(400,'invalid limit');return search(shared,q.q??'',limit);}
  if(path==='/api/browse'&&method==='GET')return browse(shared,q);
  if(path==='/api/progress'&&method==='GET')return {lists:progress(shared),curriculum:curriculumProgress(shared)};
  if(path==='/api/streak'&&method==='GET')return streak(shared,t,q.month);
  if(path==='/api/streak/makeup'&&method==='POST')return makeup(shared,String(body?.day??''),t);
  if(path==='/api/parent/summary'&&method==='GET')return parentSummary(shared,t,q.days===undefined?30:Number(q.days));
  if(path==='/api/wrong'&&method==='GET')return wrongSummary(shared,q.sort==='recent'?'recent':'count',t);
  const wrong=path.match(/^\/api\/wrong\/(\d+)$/);if(wrong&&method==='POST'){setWrong(shared,parseId(wrong[1]),!!body?.inBook,t);return {ok:true};}
  const word=path.match(/^\/api\/word\/(\d+)(\/lesson|\/content)?$/);
  if(word&&method==='GET'){
   const id=parseId(word[1]),row=db.prepare('SELECT id,headword FROM words WHERE id=?').get(id);
   if(!row)throw new HttpError(404,'这个单词不存在。');
   if(word[2]==='/content')return getContent(shared,id);
   if(word[2]==='/lesson'){
    const result=await assetFetch(`/offline/lessons/${id}.json`);if(!result.ok)return {status:'pending',lesson:null};
    const lesson=await result.json();if(lesson.wordId!==id||lesson.headword!==row.headword)throw new Error('词条资料不匹配。');
    return {status:'ready',lesson};
   }
   return wordDetail(shared,id);
  }
  const content=path.match(/^\/api\/content\/(\d+)\/feedback$/);if(content&&method==='POST')return contentFeedback(shared,parseId(content[1]),body?.reason,t);
  if(path==='/api/pronunciation'&&method==='GET'){
   const r=recordings[q.word??''];if(!r)return {status:'missing',word:q.word};const {file,...info}=r;return {status:'ready',...info};
  }
  throw new HttpError(404,'这个功能暂不可用。');
 };
 async function run(url:URL,method:string,body:unknown){
  if(url.pathname.startsWith('/api/ai/')){
   if(!options.ai)throw new HttpError(503,'请重新打开模型设置。');
   if(method!=='POST'&&!(url.pathname==='/api/ai/settings'&&method==='GET'))throw new HttpError(405,'请求方式不支持。');
   return options.ai.handle(url.pathname,body);
  }
  const task=queue.then(async()=>{const result=await dispatch(url,method,body);await options.save(db.export());return result;});
  queue=task.catch(()=>{});return task;
 }
 return {async fetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
  const url=new URL(input instanceof Request?input.url:String(input),'https://localhost');
  const method=(init?.method??(input instanceof Request?input.method:'GET')).toUpperCase();
  try{
   const text=init?.body??(input instanceof Request&&method!=='GET'?await input.text():undefined);
   const body=typeof text==='string'&&text?JSON.parse(text):undefined;
   const result=await run(url,method,body);return jsonResponse(result,{headers:{'cache-control':'no-store'}});
  }catch(e){return jsonResponse({error:e instanceof HttpError?e.message:'本机数据未能保存，请重试。'}, {status:e instanceof HttpError?e.status:503});}
 }};
}

export async function startOfflineRuntime(){
 const originalFetch=globalThis.fetch.bind(globalThis);
 const [saved,manifestResponse]=await Promise.all([learningStorage.load(),originalFetch('/offline/pronunciation.json')]);
 if(!manifestResponse.ok)throw new Error('录音索引未能载入，请重新安装完整安装包。');
 const recordings=await manifestResponse.json() as Record<string,BundledRecording>;
 let data=saved;
 if(data===null){const response=await originalFetch('/offline/seed.db');if(!response.ok)throw new Error('词库未能载入。');data=new Uint8Array(await response.arrayBuffer());}
 const db=await openBrowserDatabase(data,{locateFile:()=>'/offline/sql-wasm.wasm'});
 if(db.pragma('quick_check',{simple:true})!=='ok')throw new Error('学习数据异常，请保留应用数据以便恢复。');
 if(saved===null)await learningStorage.save(db.export());
 const ai=createOfflineAi({vault:profileVault,word:id=>db.prepare('SELECT headword,meaning_zh,phonetic FROM words WHERE id=?').get(id) as {headword:string;meaning_zh:string|null;phonetic:string|null}|undefined,
  upstream:async options=>{
   if(Capacitor.isNativePlatform())return CapacitorHttp.request({...options,method:'POST',connectTimeout:15000,readTimeout:60000,disableRedirects:true});
   const response=await originalFetch(options.url,{method:'POST',headers:options.headers,body:JSON.stringify(options.data),signal:AbortSignal.timeout(60000),redirect:'error'});
   return {status:response.status,data:await response.json()};
  }});
 const runtime=createLocalRuntime({db,save:learningStorage.save,recordings,assetFetch:originalFetch,ai});
 setMobileRecordings(recordings);
 globalThis.fetch=(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input),location.href);
  if(url.origin===location.origin&&(url.pathname.startsWith('/api/')||url.pathname==='/health'||url.pathname==='/version'))return runtime.fetch(input,init);
  return originalFetch(input,init);
 };
}
