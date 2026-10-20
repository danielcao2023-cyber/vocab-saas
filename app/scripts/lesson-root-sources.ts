/** Optional, read-only dictionary enrichment. This does not edit lessons or open a database. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {args,cli,isMain} from '../server/src/ai/cli.ts';
import {projectRoot} from '../server/src/ai/codex-runner.ts';
import {acquireLock} from '../server/src/ai/pipeline.ts';

const schemaVersion=1;
const scope='The English etymology section attests only its stated link to this exact source form. The source-language entry may supply meanings or only an inflection reference; it does not independently prove a longer historical chain or select the relevant meaning automatically.';
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
function writeJson(file:string,value:unknown){const tmp=`${file}.${process.pid}.tmp`;fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);}
function canonicalPath(file:string):string{
  let parent=path.resolve(file);const tail:string[]=[];
  while(!fs.existsSync(parent)){tail.unshift(path.basename(parent));const next=path.dirname(parent);if(next===parent)throw new Error('No existing output ancestor');parent=next;}
  return path.join(fs.realpathSync(parent),...tail);
}
type SourceRecord={url:string;status:string;retrievalMethod:string;text:string;sha256?:string;revisionId?:number;truncated?:boolean};
export type OriginReference={originLanguage:string;originForm:string;template:string;englishSource:{url:string;revisionId?:number;sha256:string;etymologyText:string}};
type RootSource={url:string;languageCode:string;retrievalMethod:'mediawiki-api-exact-language-section';fetchedAt:string;pageId:number;revisionId:number;revisionTimestamp?:string;sha256:string;text:string;truncated:boolean;license:string;licenseUrl:string};
type Result={originLanguage:string;originForm:string;status:'retrieved'|'missing-page'|'missing-language-section'|'fetch-failed';fetchedAt:string;source?:RootSource;reason?:string};

/** A same-spelled entry in any other language is deliberately not a fallback. */
export function languageSection(wikitext:string,language:string):string|null{
  const headings=[...wikitext.matchAll(/^(={2,6})[ \t]*([^\n]*?)[ \t]*\1[ \t]*$/gm)].filter(heading=>heading[1].length===2);
  for(let i=0;i<headings.length;i++){
    const match=/^\{\{langue\|\s*([^|{}]+)\s*\}\}$/.exec(headings[i][2].trim());
    if(match?.[1].trim()===language){
      const start=headings[i].index!+headings[i][0].length;
      return wikitext.slice(start,headings[i+1]?.index).trim()||null;
    }
  }
  return null;
}

function etymologySections(english:string):string[]{
  const headings=[...english.matchAll(/^(={3,6})\s*([^\n]*?)\s*\1\s*$/gm)];
  return headings.flatMap((heading,index)=>{
    if(!/^\{\{S\|\s*étymologie(?:\|[^{}]*)?\}\}$/i.test(heading[2].trim()))return [];
    const end=headings.slice(index+1).find(next=>next[1].length<=heading[1].length)?.index;
    return [english.slice(heading.index!+heading[0].length,end).trim()];
  });
}

/** Conservative template parsing: only literal source-language/form arguments are accepted. */
export function extractOriginReferences(input:unknown):{references:OriginReference[];skipped:string[]}{
  const references:OriginReference[]=[],skipped:string[]=[];
  if(!Array.isArray(input))return {references,skipped:['source-file-is-not-an-array']};
  for(const source of input as SourceRecord[]){
    if(!source||source.status!=='retrieved'||source.retrievalMethod!=='mediawiki-api-english-section'||typeof source.text!=='string')continue;
    let url:URL;try{url=new URL(source.url);}catch{continue;}
    if(url.protocol!=='https:'||url.hostname!=='fr.wiktionary.org'||!url.pathname.startsWith('/wiki/')||url.hash!=='#Anglais')continue;
    const clean=source.text.replace(/<!--[\s\S]*?-->/g,'').replace(/<(nowiki|pre|code)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
    // Existing cache files are already English-only; if full page text is supplied, isolate it again.
    const english=/^==[^=]/m.test(clean)?languageSection(clean,'en'):clean;
    if(!english){skipped.push('no-english-section');continue;}
    const sections=etymologySections(english);
    if(!sections.length){skipped.push('no-english-etymology-section');continue;}
    for(const section of sections){
      for(const match of section.matchAll(/\{\{étyl\s*\|([^{}]*?)\}\}/gi)){
        const positional=new Map<number,string>(),named=new Map<string,string>();let next=1,ambiguous=false;
        for(const part of match[1].split('|')){
          const equal=part.indexOf('=');
          if(equal<0){if(positional.has(next))ambiguous=true;positional.set(next++,part.trim());}
          else{
            const name=part.slice(0,equal).trim(),value=part.slice(equal+1).trim();
            if(/^\d+$/.test(name)){const n=Number(name);if(positional.has(n))ambiguous=true;positional.set(n,value);}
            else{if(named.has(name))ambiguous=true;named.set(name,value);}
          }
        }
        const originLanguage=positional.get(1)??'',destination=positional.get(2);
        const namedForm=named.get('mot'),third=positional.get(3);
        if(ambiguous||destination!=='en'||! /^[a-z][a-z0-9-]{1,19}$/.test(originLanguage)) {skipped.push('ambiguous-or-non-english-template');continue;}
        if(namedForm&&third&&namedForm!==third){skipped.push('conflicting-source-form');continue;}
        const originForm=namedForm??third??'';
        if(!originForm||originForm.length>160||/[\[\]{}<>|#:*\n\r]/.test(originForm)||originForm.includes("''")) {skipped.push(originForm.includes('*')?'reconstructed-source-form':'no-exact-source-form');continue;}
        references.push({originLanguage,originForm,template:match[0],englishSource:{url:source.url,revisionId:source.revisionId,sha256:sha(source.text),etymologyText:section}});
      }
    }
  }
  return {references,skipped:[...new Set(skipped)]};
}

export function retryAfterMilliseconds(value:string|null,now=Date.now()):number{
  if(!value)return 30000;
  if(/^\d+$/.test(value.trim()))return Math.max(2000,Number(value)*1000);
  const date=Date.parse(value);return Number.isFinite(date)?Math.max(2000,date-now):30000;
}
const rootKey=(language:string,form:string)=>sha(`${language}\0${form}`);

export function resolveOriginPage(originLanguage:string,originForm:string,data:any,fetchedAt=new Date().toISOString()):Result{
  const base={originLanguage,originForm,fetchedAt};
  const normalized=new Map<string,string>((data.query?.normalized??[]).map((n:any)=>[n.from,n.to]));
  const title=normalized.get(originForm)??originForm;
  const page=data.query?.pages?.find((p:any)=>p.title===title);
  if(!page||page.missing===true||page.invalid===true)return {...base,status:'missing-page',reason:'The exact requested source page is unavailable.'};
  const revision=page.revisions?.[0],raw=revision?.slots?.main?.content;
  if(typeof raw!=='string')return {...base,status:'fetch-failed',reason:'The exact page has no readable revision content.'};
  const text=languageSection(raw,originLanguage);
  if(!text)return {...base,status:'missing-language-section',reason:`The exact page has no ${originLanguage} language section; other languages were not used.`};
  const bounded=text.slice(0,35000);
  return {...base,status:'retrieved',source:{url:`https://fr.wiktionary.org/wiki/${encodeURIComponent(title)}`,languageCode:originLanguage,retrievalMethod:'mediawiki-api-exact-language-section',fetchedAt,pageId:page.pageid,revisionId:revision.revid,revisionTimestamp:revision.timestamp,sha256:sha(bounded),text:bounded,truncated:text.length>35000,license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'}};
}

type Options={sourceDirectory?:string;outputDirectory?:string;wordIds?:number[];limit?:number;refresh?:boolean;fetcher?:typeof fetch;wait?:(ms:number)=>Promise<void>};
export async function fetchLessonRootSources(options:Options={}){
  const sourceDirectory=options.sourceDirectory??path.join(projectRoot(),'.tmp/lesson-source-evidence');
  const outputDirectory=options.outputDirectory??path.join(projectRoot(),'.tmp/lesson-root-evidence');
  const relativeOutput=path.relative(canonicalPath(sourceDirectory),canonicalPath(outputDirectory));
  if(relativeOutput===''||relativeOutput!== '..'&&!relativeOutput.startsWith(`..${path.sep}`)&&!path.isAbsolute(relativeOutput))throw new Error('root output must not overwrite original evidence');
  const cacheDirectory=path.join(outputDirectory,'cache');fs.mkdirSync(cacheDirectory,{recursive:true});
  const unlock=acquireLock(path.join(outputDirectory,'fetch.lock'));
  const fetcher=options.fetcher??fetch,wait=options.wait??sleep;
  try{
    const ids=options.wordIds??fs.readdirSync(sourceDirectory).filter(file=>/^\d+\.json$/.test(file)).map(file=>Number(file.slice(0,-5))).sort((a,b)=>a-b).slice(0,options.limit??10);
    if(ids.some(id=>!Number.isSafeInteger(id)||id<1))throw new Error('word IDs must be positive integers');
    const words=ids.map(wordId=>{
      const sourceFile=path.join(sourceDirectory,`${wordId}.json`);let raw='',input:unknown;
      try{raw=fs.readFileSync(sourceFile,'utf8');input=JSON.parse(raw);}catch{return {wordId,sourceFile,sourceFileSha256:sha(raw),references:[] as OriginReference[],skipped:['missing-or-invalid-source-file']};}
      return {wordId,sourceFile,sourceFileSha256:sha(raw),...extractOriginReferences(input)};
    });
    const requests=new Map<string,OriginReference>();
    for(const word of words)for(const ref of word.references)requests.set(rootKey(ref.originLanguage,ref.originForm),ref);
    const results=new Map<string,Result>();
    for(const [key,ref] of requests){
      if(options.refresh)continue;
      try{
        const cached=JSON.parse(fs.readFileSync(path.join(cacheDirectory,`${key}.json`),'utf8'));
        const r=cached.result as Result;
        if(cached.schemaVersion===schemaVersion&&r.originLanguage===ref.originLanguage&&r.originForm===ref.originForm
          &&(r.status==='missing-page'||r.status==='missing-language-section'||r.status==='retrieved'&&r.source?.languageCode===ref.originLanguage&&r.source.sha256===sha(r.source.text)))results.set(key,r);
      }catch{/* An absent or invalid cache entry is fetched again. */}
    }
    const pending=[...requests].filter(([key])=>!results.has(key));
    const titles=[...new Set(pending.map(([,ref])=>ref.originForm))];
    let requestCount=0;
    for(let offset=0;offset<titles.length;offset+=25){
      const batch=titles.slice(offset,offset+25);
      const params=new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'revisions',rvprop:'content|ids|timestamp',rvslots:'main',titles:batch.join('|')});
      let data:any,failure='No dictionary response',nextDelay=2000,rateLimited=false;
      for(let attempt=0;attempt<3;attempt++){
        if(requestCount>0)await wait(nextDelay);requestCount++;nextDelay=2000;
        rateLimited=false;
        try{
          const response=await fetcher(`https://fr.wiktionary.org/w/api.php?${params}`,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'VocabLessonRootReference/1.0 (educational reference; https://github.com/danielcao2023-cyber)'}});
          if(response.status===429||response.status===503){
            rateLimited=true;
            nextDelay=retryAfterMilliseconds(response.headers.get('retry-after'));failure=`Dictionary rate limited (${response.status}).`;
            if(nextDelay>60000){failure+=' Retry-After exceeds one minute; resume later.';break;}continue;
          }
          if(!response.ok)throw new Error(`dictionary HTTP ${response.status}`);
          const parsed=await response.json();if(!Array.isArray(parsed.query?.pages))throw new Error('invalid dictionary response');data=parsed;break;
        }catch(error){failure=(error as Error).message;}
      }
      for(const [key,ref] of pending.filter(([,ref])=>batch.includes(ref.originForm))){
        const result:Result=data?resolveOriginPage(ref.originLanguage,ref.originForm,data):{originLanguage:ref.originLanguage,originForm:ref.originForm,status:'fetch-failed',fetchedAt:new Date().toISOString(),reason:failure};
        results.set(key,result);
        if(result.status!=='fetch-failed')writeJson(path.join(cacheDirectory,`${key}.json`),{schemaVersion,result});
      }
      // A long Retry-After stops the run; never issue another batch ahead of that deadline.
      if(!data&&rateLimited){
        for(const [key,ref] of pending)if(!results.has(key))results.set(key,{originLanguage:ref.originLanguage,originForm:ref.originForm,status:'fetch-failed',fetchedAt:new Date().toISOString(),reason:failure});
        break;
      }
    }
    const stats={words:words.length,origins:requests.size,retrieved:0,missing:0,failed:0,skipped:0,networkRequests:requestCount};
    for(const word of words){
      const keys=[...new Set(word.references.map(ref=>rootKey(ref.originLanguage,ref.originForm)))];
      const origins=keys.map(key=>({...results.get(key)!,englishReferences:word.references.filter(ref=>rootKey(ref.originLanguage,ref.originForm)===key)}));
      const ready=origins.filter(result=>result.status==='retrieved').length;
      const status=!origins.length?'skipped':ready===origins.length?'retrieved':ready?'partial':'unavailable';
      if(!origins.length)stats.skipped++;
      writeJson(path.join(outputDirectory,`${word.wordId}.json`),{schemaVersion,wordId:word.wordId,sourceFile:word.sourceFile,sourceFileSha256:word.sourceFileSha256,checkedAt:new Date().toISOString(),status,scope,origins,skipped:word.skipped});
    }
    for(const result of results.values())if(result.status==='retrieved')stats.retrieved++;else if(result.status==='fetch-failed')stats.failed++;else stats.missing++;
    writeJson(path.join(outputDirectory,'progress.json'),{updatedAt:new Date().toISOString(),...stats});return stats;
  }finally{unlock();}
}

if(isMain(import.meta.url))cli(()=>{
  const a=args();
  if(Object.keys(a).some(key=>!['ids','limit','refresh'].includes(key)))throw new Error('Use --ids 2,7,9 or --limit 10; no database input is used.');
  const wordIds=typeof a.ids==='string'?a.ids.split(',').map(Number):undefined;
  const limit=a.limit===undefined?10:Number(a.limit);
  if(!Number.isSafeInteger(limit)||limit<1)throw new Error('--limit must be a positive integer');
  return fetchLessonRootSources({wordIds,limit,refresh:a.refresh===true});
});
