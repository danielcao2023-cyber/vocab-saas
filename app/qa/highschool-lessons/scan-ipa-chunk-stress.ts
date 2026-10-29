// Read-only candidate generation, not an error detector; run from app/: npx tsx qa/highschool-lessons/scan-ipa-chunk-stress.ts
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
  const clean=(s:string)=>s.replace(/[\/ˈˌ.\s]/g,'');
  const ipa=clean(lesson.ipa), joined=lesson.chunks.map(c=>clean(c.sound)).join('');
  const vowels=/[aeiouæɑɒɔʌəɚɝɪʊɛɜʏœøɐɨɯɶ]/;
  const markers:{kind:string,position:number}[]=[]; let at=0;
  for(const ch of lesson.ipa){if(ch==='ˈ'||ch==='ˌ')markers.push({kind:ch==='ˈ'?'primary':'secondary',position:at});else at+=clean(ch).length;}
  const issues:string[]=[];
  if(ipa!==joined)issues.push('整词与分段音素不一致');
  for(const marker of markers){const v=ipa.slice(marker.position).search(vowels);let offset=0;
   const chunk=v<0?undefined:lesson.chunks.find(c=>{const end=offset+clean(c.sound).length;const hit=marker.position+v>=offset&&marker.position+v<end;offset=end;return hit;});
   if(chunk?.stress!==marker.kind)issues.push(`${marker.kind} 未对准后续重读元音`);
  }
  if(markers.length && lesson.chunks.filter(c=>c.stress==='primary').length!==markers.filter(m=>m.kind==='primary').length)issues.push('主重音数量不符');
  if(lesson.chunks.filter(c=>c.stress==='secondary').length!==markers.filter(m=>m.kind==='secondary').length)issues.push('次重音数量不符');
  if(issues.length)results.push({key:e.key,headword:lesson.headword,ipa:lesson.ipa,issues});
 }
}
console.log(JSON.stringify({version:catalog.version,uniqueMaps:seen.size,candidates:results},null,2));db.close();
