// Read-only candidate generation, not an error detector; run from app/: npx tsx qa/highschool-lessons/scan-stress-hint-conflicts.ts
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
  for(const chunk of lesson.chunks){const words=[chunk.hint,chunk.tip].join('；');
   if((chunk.stress==='primary'||chunk.stress==='secondary') && /此部分轻读|本段轻读|这一部分轻读|这里轻读|此处轻读/.test(words)) results.push({key:e.key,headword:lesson.headword,ipa:lesson.ipa,letters:chunk.letters,stress:chunk.stress,words});
   if(chunk.stress==='none' && /此部分重读|本段重读|这一部分重读|这里重读|此处重读|首部分重读/.test(words)) results.push({key:e.key,headword:lesson.headword,ipa:lesson.ipa,letters:chunk.letters,stress:chunk.stress,words});
  }
 }
}
console.log(JSON.stringify({version:catalog.version,uniqueMaps:seen.size,candidates:results},null,2));db.close();
