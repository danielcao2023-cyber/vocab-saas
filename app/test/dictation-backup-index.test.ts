import {afterEach,expect,it,vi} from 'vitest';
import {learningStorage} from '../web/src/offline/storage';
afterEach(()=>vi.unstubAllGlobals());
it('refuses to create an empty database when only the dictation migration backup survives',async()=>{
 const values=new Map<string,unknown>([['learning-pre-dictation-variant-v1',new Uint8Array([1,2,3])]]);
 vi.stubGlobal('indexedDB',{open:()=>{const request:any={};queueMicrotask(()=>{request.result={close(){},transaction(){const tx:any={objectStore(){return {get(key:string){const get:any={};queueMicrotask(()=>{get.result=values.get(key);get.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return get;}}}};return tx}};request.onsuccess?.()});return request}});
 await expect(learningStorage.load()).rejects.toThrow(/学习索引缺失/);
});
