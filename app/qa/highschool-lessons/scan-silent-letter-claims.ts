// Read-only candidate generation, not an error detector; run from app/: npx tsx qa/highschool-lessons/scan-silent-letter-claims.ts
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
  const segments=lesson.chunks.map(c=>({text:c.hint+'；'+c.tip,pairs:c.pairs}));segments.push({text:lesson.variantNote||'',pairs:lesson.chunks.flatMap(c=>c.pairs)});
  for(const seg of segments)for(const match of seg.text.matchAll(/(?:字母\s*)?([a-z])(?:\s*字母)?\s*(?:在此|在这里|在这儿|通常|常|一般)?\s*(?:不单独发音|不发音|不读|是静音)/gi)){
    const letter=match[1].toLowerCase(),pairs=seg.pairs.filter(p=>p.letters.toLowerCase()===letter&&p.sound);
    if(pairs.length)results.push({key:e.key,headword:lesson.headword,ipa:lesson.ipa,letter,text:seg.text,pairs});
  }
 }
}
console.log(JSON.stringify({version:catalog.version,uniqueMaps:seen.size,candidates:results},null,2));db.close();
