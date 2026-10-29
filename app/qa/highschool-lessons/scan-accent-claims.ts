// Read-only candidate generation, not an error detector; run from app/: npx tsx qa/highschool-lessons/scan-accent-claims.ts
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
  const n=lesson.variantNote||'';
  const vowel=/[aeiouæɑɒɔʌəɚɝɪʊɛɜʏœøɐɨɯɶ]/;
  const stressVowel=(s:string)=>{const mark=s.indexOf('ˈ');if(mark<0)return -1;let count=0,inside=false;for(const ch of s.slice(0,mark)){const v=vowel.test(ch);if(v&&!inside)count++;inside=v;}return count;};
  if(lesson.uk && /^\/[\/ˈˌ.\sa-zɑæɒɔʌəɚɝɪʊɛɜʃʒŋθðʧʤʔɡɾː]+\/$/i.test(lesson.uk) && stressVowel(lesson.ipa)>=0 && stressVowel(lesson.uk)>=0 && stressVowel(lesson.ipa)!==stressVowel(lesson.uk)) results.push({key:e.key,headword:lesson.headword,ipa:lesson.ipa,uk:lesson.uk,note:n});
 }
}
console.log(JSON.stringify({version:catalog.version,uniqueMaps:seen.size,candidates:results},null,2));db.close();
