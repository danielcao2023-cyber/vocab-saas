import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateLesson} from '../server/src/lessons.ts';

/** Deterministic content index; aliases preserve curated core spelling/headword identities. */
export function makeLessonIdentityIndex(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')):Record<string,{id:number;headword:string}>{
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/vocabulary/catalog.json'),'utf8')) as {entries:{key:string;headword:string}[]};
 const aliases=JSON.parse(fs.readFileSync(path.join(root,'shared/lesson-identity-aliases.json'),'utf8')) as Record<string,string>;
 const byHeadword=new Map<string,number>();const dir=path.join(root,'data/lessons');
 for(const file of fs.readdirSync(dir).filter(x=>/^[1-9]\d*\.json$/.test(x))){
  const id=Number(file.slice(0,-5)),raw=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  if(raw.wordId!==id||typeof raw.headword!=='string'||!validateLesson(raw,{id,headword:raw.headword}).ok||raw.editorial.status!=='reviewed')throw Error(`Invalid lesson identity ${file}`);
  if(byHeadword.has(raw.headword))throw Error(`Duplicate lesson headword ${raw.headword}`);
  byHeadword.set(raw.headword,id);
 }
 const keys=new Set<string>(),result:Record<string,{id:number;headword:string}>={};
 for(const entry of catalog.entries){
  if(keys.has(entry.key))throw Error(`Duplicate catalog key ${entry.key}`);keys.add(entry.key);
  const headword=Object.hasOwn(aliases,entry.key)?aliases[entry.key]:entry.headword;
  const id=byHeadword.get(headword);if(id!==undefined)result[entry.key]={id,headword};
  else if(Object.hasOwn(aliases,entry.key))throw Error(`Unresolved curated alias ${entry.key}`);
 }
 for(const key of Object.keys(aliases))if(!keys.has(key))throw Error(`Unknown curated alias ${key}`);
 return Object.fromEntries(Object.entries(result).sort(([a],[b])=>a<b?-1:a>b?1:0));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const output=path.resolve('shared/lesson-identities.json'),generated=JSON.stringify(makeLessonIdentityIndex())+'\n';
 if(process.argv.includes('--write'))fs.writeFileSync(output,generated);
 else if(fs.readFileSync(output,'utf8')!==generated)throw Error('Lesson identity index is stale; run npx tsx scripts/lesson-identity-index.ts --write');
 console.log('Lesson identity index is consistent.');
}
