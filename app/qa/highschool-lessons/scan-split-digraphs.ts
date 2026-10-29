// Read-only candidate generation, not an error detector; run from app/: npx tsx qa/highschool-lessons/scan-split-digraphs.ts
import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {getSoundSpellingLessons} from '../../web/src/content/sound-spelling';
const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
const map=new Map((db.prepare('SELECT m.entry_key,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id').all() as any[]).map(r=>[r.entry_key,r.headword]));
const seen=new Set<string>();const results:any[]=[];
for(const e of catalog.entries.filter((x:any)=>x.memberships.some((m:any)=>m.bookId.startsWith('pep2019-')))){
 const shown=map.get(e.key) as string|undefined;if(!shown)continue;
 for(const lesson of getSoundSpellingLessons(shown)){
  if(seen.has(lesson.headword.toLowerCase()))continue;seen.add(lesson.headword.toLowerCase());
  const pairs=lesson.chunks.flatMap((chunk,chunkIndex)=>chunk.pairs.map(p=>({...p,chunkIndex})));
  for(let i=0;i<pairs.length-1;i++){
   const a=pairs[i],b=pairs[i+1],letters=(a.letters+b.letters).toLowerCase();
   if(!['sh','ch','th','ph','wh','ng','ck'].includes(letters))continue;
   if(a.letters.length!==1||b.letters.length!==1)continue;
   results.push({key:e.key,headword:lesson.headword,ipa:lesson.ipa,digraph:letters,left:a,right:b,sameChunk:a.chunkIndex===b.chunkIndex});
  }
 }
}
console.log(JSON.stringify({version:catalog.version,uniqueMaps:seen.size,candidates:results},null,2));db.close();
