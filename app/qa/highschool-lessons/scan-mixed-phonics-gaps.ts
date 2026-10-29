// Run from app/: npx tsx qa/highschool-lessons/scan-mixed-phonics-gaps.ts
import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {mainHeadwords} from '../../server/src/text';
import {getSoundSpellingLessons} from '../../web/src/content/sound-spelling';
const c=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
const m=new Map((db.prepare('SELECT m.entry_key,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id').all() as any[]).map(r=>[r.entry_key,r.headword]));
const rows=c.entries.filter((e:any)=>e.memberships.some((x:any)=>x.bookId.startsWith('pep2019-'))).map((e:any)=>{
 const headword=m.get(e.key) as string|undefined;if(!headword)return null;
 const forms=[...new Set(mainHeadwords(headword))];if(forms.length<2)return null;
 return {key:e.key,headword,forms:forms.map(f=>({form:f,results:getSoundSpellingLessons(f).map(v=>v.headword)}))};
}).filter(Boolean);
console.log(JSON.stringify({version:c.version,total:rows.length,partial:rows.filter((r:any)=>r.forms.some((f:any)=>f.results.length)&&r.forms.some((f:any)=>!f.results.length)),missingAll:rows.filter((r:any)=>r.forms.every((f:any)=>!f.results.length))},null,2));db.close();
