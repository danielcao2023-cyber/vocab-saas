import {vi} from 'vitest';
import {createRenderer,h,nextTick,reactive} from 'vue';
import {clientComponent} from './client-components.ts';
export class Host {
  children:Host[]=[];parent:Host|null=null;props:Record<string,any>={};text='';value='';tagName:string;
  constructor(public tag:string){this.tagName=tag.toUpperCase();}
  addEventListener(){} removeEventListener(){} setAttribute(k:string,v:any){this.props[k]=v;} removeAttribute(k:string){delete this.props[k];}
  get options(){return this.children.filter(n=>n.tag==='option');}
  getRootNode(){return globalThis.document;} focus(){(document as any).activeElement=this;}
}
export function host(file:string,props:any={}) {
  const events=new Map<string,Set<Function>>(),storage=new Map<string,string>();
  vi.stubGlobal('HTMLInputElement',Host);class Doc{activeElement:Host|null=null;}
  vi.stubGlobal('Document',Doc);vi.stubGlobal('ShadowRoot',class{});vi.stubGlobal('document',new Doc());
  vi.stubGlobal('window',{setInterval:globalThis.setInterval,localStorage:{setItem:(k:string,v:string)=>storage.set(k,v),getItem:(k:string)=>storage.get(k)??null},addEventListener:(k:string,f:Function)=>{if(!events.has(k))events.set(k,new Set());events.get(k)!.add(f);},removeEventListener:(k:string,f:Function)=>events.get(k)?.delete(f)});
  const renderer=createRenderer<Host,Host>({createElement:t=>new Host(t),createText:text=>Object.assign(new Host('#text'),{text}),createComment:()=>new Host('#comment'),setText:(n,t)=>{n.text=t;},setElementText:(n,t)=>{n.text=t;n.children=[];},parentNode:n=>n.parent,nextSibling:n=>n.parent?.children[(n.parent?.children.indexOf(n)??-1)+1]??null,patchProp:(n,k,_o,v)=>{n.props[k]=v;if(k==='value')n.value=v;},insert:(n,p,a)=>{if(n.parent){const i=n.parent.children.indexOf(n);if(i>=0)n.parent.children.splice(i,1);}n.parent=p;const i=a?p.children.indexOf(a):-1;if(i<0)p.children.push(n);else p.children.splice(i,0,n);},remove:n=>{if(n.parent){const i=n.parent.children.indexOf(n);if(i>=0)n.parent.children.splice(i,1);n.parent=null;}}});
  const root=new Host('root'),component=clientComponent(file),state=reactive({...props});
  const app=renderer.createApp({setup:()=>()=>h(component,state)});app.mount(root);
  const all=(predicate:(n:Host)=>boolean)=>{const found:Host[]=[];const visit=(n:Host)=>{if(predicate(n))found.push(n);n.children.forEach(visit);};visit(root);return found;};
  const text=(n:Host=root):string=>n.text+n.children.map(x=>text(x)).join('');
  const key=(key:string,target:any=null)=>{for(const f of events.get('keydown')??[])f({key,target,preventDefault(){}});};
  return {root,app,all,text,key,storage,updateProps:(patch:Record<string,unknown>)=>Object.assign(state,patch)};
}
export async function flush(){for(let i=0;i<6;i++){await new Promise(resolve=>setImmediate(resolve));await nextTick();}}
