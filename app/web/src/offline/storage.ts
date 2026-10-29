import {Capacitor,registerPlugin} from '@capacitor/core';
import {Directory,Filesystem} from '@capacitor/filesystem';

interface VaultPlugin {get(options:{key:string}):Promise<{value:string|null}>;set(options:{key:string;value:string}):Promise<void>;remove(options:{key:string}):Promise<void>;writeSnapshot(options:{slot:'a'|'b';data:string}):Promise<void>;createMigrationBackup(options:{version:3;data:string}):Promise<void>;createVocabularyBackup(options:{version:number;data:string}):Promise<void>;createDictationVariantBackup(options:{data:string}):Promise<void>}
const vault=registerPlugin<VaultPlugin>('MobileVault');
const native=()=>Capacitor.isNativePlatform();
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 const request=indexedDB.open('xiaobei-mobile-v1',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('state');
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('本机存储未能打开。'));
});}
async function idbGet<T>(key:string):Promise<T|null>{const db=await database();try{return await new Promise<T|null>((resolve,reject)=>{
 const tx=db.transaction('state','readonly'),request=tx.objectStore('state').get(key);let result:T|null=null;
 request.onsuccess=()=>{result=request.result??null;};tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(new Error('本机存储读取失败。'));
});}finally{db.close();}}
async function idbSet(key:string,value:unknown){const db=await database();try{await new Promise<void>((resolve,reject)=>{
 const tx=db.transaction('state','readwrite');tx.objectStore('state').put(value,key);tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(new Error('本机存储保存失败。'));
});}finally{db.close();}}
function base64(bytes:Uint8Array){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
function bytes(text:string){const raw=atob(text);return Uint8Array.from(raw,c=>c.charCodeAt(0));}

/** Native lock/fsync/pointer commit form one operation; native failures poison writes until a new process. */
export const learningStorage={
 async load():Promise<Uint8Array|null>{
  if(!native()){const data=await idbGet<Uint8Array>('learning-db');if(data===null&&(await idbGet('learning-pre-v3')!==null||await idbGet('learning-pre-dictation-variant-v1')!==null))throw new Error('学习索引缺失，请保留迁移备份以便恢复。');return data;}
  const pointer=(await vault.get({key:'learning-slot-v1'})).value;
  if(pointer===null)return null;
  if(!['a','b'].includes(pointer))throw new Error('学习数据索引异常，请保留应用数据以便恢复。');
  const file=await Filesystem.readFile({path:`learning-${pointer}.db`,directory:Directory.Data});
  if(typeof file.data!=='string')throw new Error('学习数据读取异常，请保留应用数据。');
  return bytes(file.data);
 },
 async createMigrationBackup(data:Uint8Array,version:3):Promise<void>{
  if(version!==3)throw new Error('迁移版本无效。');
  if(native()){await vault.createMigrationBackup({version,data:base64(data)});return;}
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(data)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const db=await database();try{await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),get=store.get('learning-pre-v3');
   get.onsuccess=()=>{const old=get.result;if(old){if(old.hash!==hash||old.data.length!==data.length||!data.every((b,i)=>old.data[i]===b))tx.abort();}else store.put({version,hash,data:new Uint8Array(data)},'learning-pre-v3');};
   tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(new Error('迁移前备份冲突或保存失败，原备份未被覆盖。'));
  });}finally{db.close();}
  const verify=await idbGet<{hash:string;data:Uint8Array}>('learning-pre-v3');if(!verify||verify.hash!==hash||verify.data.length!==data.length||!data.every((b,i)=>verify.data[i]===b))throw new Error('迁移备份回读校验失败。');
 },
 async save(data:Uint8Array):Promise<void>{
  if(!native()){await idbSet('learning-db',data);return;}
  const current=(await vault.get({key:'learning-slot-v1'})).value;
  if(current!==null&&!['a','b'].includes(current))throw new Error('学习数据索引异常。');
  const next=current==='a'?'b':'a';
  await vault.writeSnapshot({slot:next,data:base64(data)});
 },
 async createVocabularyBackup(data:Uint8Array,version:number):Promise<void>{
  if(!Number.isInteger(version)||version<1||version>999)throw Error('词库版本无效。');
  if(native()){await vault.createVocabularyBackup({version,data:base64(data)});return;}
  const key='learning-pre-vocabulary-'+version,db=await database();
  try{await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),get=store.get(key);
   get.onsuccess=()=>{const old=get.result as Uint8Array|undefined;if(old){if(old.length!==data.length||!data.every((b,i)=>old[i]===b))tx.abort();}else store.put(new Uint8Array(data),key);};
   tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(Error('词库升级备份冲突或保存失败，原备份未被覆盖。'));
  });}finally{db.close();}
  const verified=await idbGet<Uint8Array>(key);if(!verified||verified.length!==data.length||!data.every((b,i)=>verified[i]===b))throw Error('词库升级备份校验失败。');
 },
 async createDictationVariantBackup(data:Uint8Array):Promise<void>{
  if(native()){await vault.createDictationVariantBackup({data:base64(data)});return;}
  const key='learning-pre-dictation-variant-v1',db=await database();
  try{await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),get=store.get(key);
   get.onsuccess=()=>{const old=get.result as Uint8Array|undefined;if(old){if(old.length!==data.length||!data.every((b,i)=>old[i]===b))tx.abort();}else store.put(new Uint8Array(data),key);};
   tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(Error('听写升级备份冲突或保存失败，原备份未被覆盖。'));
  });}finally{db.close();}
  const verified=await idbGet<Uint8Array>(key);if(!verified||verified.length!==data.length||!data.every((b,i)=>verified[i]===b))throw Error('听写升级备份校验失败。');
 },
};
