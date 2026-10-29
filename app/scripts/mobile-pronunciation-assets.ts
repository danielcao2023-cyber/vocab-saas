import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const safeUrl=(v:unknown)=>{try{const u=new URL(String(v));return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function packPronunciations(manifest:any,source:string,destination:string){
 const recordings:Record<string,any>={},rows:string[]=[],anchored=new Set<string>();
 const pack=(word:string,r:any,label:string)=>{
  if(!r||r.word!==word||!['us','uk','unknown'].includes(r.accent)||typeof r.file!=='string'||!/^[A-Za-z0-9_-]+\.mp3$/.test(r.file)||typeof r.sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.sha256)||![r.author,r.license].every(v=>typeof v==='string'&&v.trim())||![r.sourceUrl,r.licenseUrl].every(safeUrl))return;
  let file:string;try{file=fs.realpathSync(path.join(source,r.file));if(!file.startsWith(fs.realpathSync(source)+path.sep))return;}catch{return;}
  const stat=fs.statSync(file);if(!stat.isFile()||stat.size===0||stat.size>2_000_000)return;
  const data=fs.readFileSync(file);if(createHash('sha256').update(data).digest('hex')!==r.sha256)throw new Error(`Recording integrity mismatch: ${word} ${label}`);
  fs.writeFileSync(path.join(destination,r.file),data);
  const {file:ignored,variants:unused,...info}=r;
  const anchor=anchored.has(word)?'':` id="${escape(word)}"`;anchored.add(word);
  rows.push(`<tr${anchor}><td>${escape(word)}${label?`（${escape(label)}）`:''}</td><td>${escape(r.author)}${typeof r.pronunciationNote === 'string' && r.pronunciationNote.trim()?`<br>${escape(r.pronunciationNote.trim())}`:''}</td><td><a href="${escape(r.sourceUrl)}">${escape(typeof r.sourceLabel === 'string' && r.sourceLabel.trim()?r.sourceLabel.trim():'原始录音')}</a></td><td><a href="${escape(r.licenseUrl)}">${escape(r.license)}</a></td></tr>`);
  return {...info,file:`/offline/recordings/${r.file}`};
 };
 if(manifest?.version!==1||!manifest.entries||typeof manifest.entries!=='object')return {recordings,credits:''};
 for(const [word,raw] of Object.entries(manifest.entries)){
  const r=raw as any,base=pack(word,r,''),variants:Record<string,any>={};
  for(const variant of ['noun','verb'] as const){const v=pack(word,r?.variants?.[variant],typeof r?.variants?.[variant]?.label==='string'&&r.variants[variant].label.trim()?r.variants[variant].label.trim():variant==='noun'?'名词':'动词');if(v)variants[variant]=v;}
  if(base||Object.keys(variants).length)recordings[word]={...(base??{word}),...(Object.keys(variants).length?{variants}:{})};
 }
 return {recordings,credits:rows.join('')};
}
