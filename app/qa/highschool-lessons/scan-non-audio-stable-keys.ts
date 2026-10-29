// From app/: npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts > /tmp/highschool-stable-coverage.json
// Reads the formal catalogue and current built seed read-only; does not modify user databases.
import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {createLessonReader} from '../../server/src/lessons';
import {getSoundSpellingLessons} from '../../web/src/content/sound-spelling/index';
import {hasDictionaryPlaceholder} from '../../server/src/text';
const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
const mapping=new Map<string,{id:number;headword:string}>((db.prepare('SELECT m.entry_key,w.id,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id').all() as any[]).map(r=>[r.entry_key,r]));
const read=createLessonReader();
const entries=catalog.entries.filter((e:any)=>e.memberships.some((m:any)=>m.bookId.startsWith('pep2019-')));
const rows=entries.map((e:any)=>{
 const word=mapping.get(e.key); if(!word)return {key:e.key,catalogHeadword:e.headword,missingMapping:true};
 const result=read(e.key==='Log'?{...word,keyedName:'highschool-log.json'}:word);const l=result.lesson;
 const actualShown=e.key==='Log'?'log':word.headword;
 const shape=/^[A-Za-z]+$/.test(e.headword)?'single-letters':/\s/.test(e.headword)?'multi-token':'other';
 return {key:e.key,catalogHeadword:e.headword,storedHeadword:word.headword,ready:result.status==='ready',emptyAllIpa:!!l&&!l.pronunciation.ipa&&!l.pronunciation.uk&&!l.pronunciation.us,soundChoices:getSoundSpellingLessons(actualShown).map(x=>x.headword),shape,placeholder:hasDictionaryPlaceholder(actualShown),senseCount:l?.senses.length??0};
});
const select=(test:(r:any)=>boolean)=>rows.filter(test).map((r:any)=>({key:r.key,headword:r.catalogHeadword,shape:r.shape,placeholder:r.placeholder,senses:r.senseCount}));
const output={catalogVersion:catalog.version,seedVersion:db.prepare("select value from vocabulary_meta where key='catalog_version'").get(),scope:'unique catalog entries with pep2019 membership, matched by vocabulary_entry_map.entry_key',reader:'createLessonReader from data/lessons using seed local word id and stored headword; Log handled as application does',phonicsReader:'getSoundSpellingLessons with the displayed headword',limitations:['shape is orthographic only; syllable count, phrase suitability, proper-name status, and content quality require manual review','reader validity and sense counts do not establish semantic correctness','seed snapshot may differ from installed Android package or other devices'],total:rows.length,missingMap:select((r:any)=>r.missingMapping),pending:select((r:any)=>!r.missingMapping&&!r.ready),emptyAllIpa:select((r:any)=>r.emptyAllIpa),noSoundMapping:select((r:any)=>!r.missingMapping&&!r.soundChoices.length),singleSense:select((r:any)=>r.ready&&r.senseCount===1),emptyIpaCapitalizedCandidates:select((r:any)=>r.emptyAllIpa&&/^[A-Z]/.test(r.catalogHeadword)),protectedPlaceholder:select((r:any)=>r.placeholder)};
console.log(JSON.stringify(output,null,2));db.close();
