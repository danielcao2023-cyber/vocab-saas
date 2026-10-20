import {Capacitor,registerPlugin} from '@capacitor/core';
import {Directory,Filesystem} from '@capacitor/filesystem';

interface VaultPlugin {get(options:{key:string}):Promise<{value:string|null}>;set(options:{key:string;value:string}):Promise<void>;remove(options:{key:string}):Promise<void>;writeSnapshot(options:{slot:'a'|'b';data:string}):Promise<void>}
const vault=registerPlugin<VaultPlugin>('MobileVault');
const native=()=>Capacitor.isNativePlatform();
export const profileVault={
 async get(){return native()?(await vault.get({key:'profiles-v1'})).value:await idbGet<string>('profiles-v1');},
 async set(value:string){if(native())await vault.set({key:'profiles-v1',value});else await idbSet('profiles-v1',value);},
};
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
  if(!native())return idbGet<Uint8Array>('learning-db');
  const pointer=(await vault.get({key:'learning-slot-v1'})).value;
  if(pointer===null)return null;
  if(!['a','b'].includes(pointer))throw new Error('学习数据索引异常，请保留应用数据以便恢复。');
  const file=await Filesystem.readFile({path:`learning-${pointer}.db`,directory:Directory.Data});
  if(typeof file.data!=='string')throw new Error('学习数据读取异常，请保留应用数据。');
  return bytes(file.data);
 },
 async save(data:Uint8Array):Promise<void>{
  if(!native()){await idbSet('learning-db',data);return;}
  const current=(await vault.get({key:'learning-slot-v1'})).value;
  if(current!==null&&!['a','b'].includes(current))throw new Error('学习数据索引异常。');
  const next=current==='a'?'b':'a';
  await vault.writeSnapshot({slot:next,data:base64(data)});
 },
};
