/** Read-only audit of the built offline seed and bundled primary recordings.
 * Usage from app/: npx tsx scripts/audit-highschool-offline-audio.ts [--missing-json OUTPUT]
 * The optional output must not already exist; no database or bundled assets are changed.
 */
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import Database from 'better-sqlite3';
import {pronunciationHeadword} from '../web/src/audio.ts';
import {hasDictionaryPlaceholder} from '../server/src/text.ts';
import {protectTarget} from '../server/src/guard.ts';
import {recordingRequirement,type AudioExemption} from './lib/recording-requirement.ts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.length && (args.length!==2||args[0]!=='--missing-json'||!args[1])) throw new Error('Usage: audit-highschool-offline-audio.ts [--missing-json OUTPUT]');
const readJson=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const cat=readJson(join(root,'data/vocabulary/catalog.json'));
const offline=readJson(join(root,'mobile-public/offline/pronunciation.json'));
const source=readJson(join(root,'data/pronunciation/manifest.json'));
const exemptions=readJson(join(root,'data/pronunciation/highschool-audio-exemptions.json'));
if(exemptions.version!==1||!exemptions.entries||typeof exemptions.entries!=='object') throw new Error('Unexpected audio exemption format');
for(const [word,reason] of Object.entries(exemptions.entries)) {
 if(!word.trim()||word!==word.trim()||!['abbreviation','proper-name','transliteration'].includes(reason as string)) throw new Error(`Invalid audio exemption: ${word}`);
}
if(source.version!==1||!source.entries||!Array.isArray(cat.entries)||!offline||typeof offline!=='object') throw new Error('Unexpected catalog or pronunciation format');
const seedPath=join(root,'mobile-public/offline/seed.db');
protectTarget(seedPath);
const db=new Database(seedPath,{readonly:true,fileMustExist:true});
const lookup=db.prepare('SELECT w.id,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id WHERE m.entry_key=?');
const cache=new Map<string,boolean>();
function valid(word:string,entry:any,dir:string,offlinePath:boolean):boolean {
 if(!entry||entry.word!==word||!['us','uk','unknown'].includes(entry.accent)||typeof entry.file!=='string'||typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.sha256)) return false;
 if(![entry.author,entry.license].every(v=>typeof v==='string'&&v.trim())) return false;
 for(const v of [entry.sourceUrl,entry.licenseUrl]){try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)return false;}catch{return false;}}
 const prefix='/offline/recordings/';
 const file=offlinePath?(entry.file.startsWith(prefix)?entry.file.slice(prefix.length):''):entry.file;
 if(!/^[A-Za-z0-9_-]+\.mp3$/.test(file))return false;
 const path=join(dir,file);const k=path+'\0'+entry.sha256;
 if(cache.has(k))return cache.get(k)!;
 let ok=false;try{const real=realpathSync(path),base=realpathSync(dir)+sep,s=statSync(real);ok=real.startsWith(base)&&s.isFile()&&s.size>0&&s.size<=2_000_000&&createHash('sha256').update(readFileSync(real)).digest('hex')===entry.sha256;}catch{/* missing or unreadable */}
 cache.set(k,ok);return ok;
}
try {
 const rows=cat.entries.filter((e:any)=>e.memberships.some((m:any)=>m.bookId.startsWith('pep2019-'))).map((e:any)=>{
  const w=lookup.get(e.key) as {id:number;headword:string}|undefined;
  const spoken=w?pronunciationHeadword(w.headword):null;
  const r=spoken?offline[spoken]:undefined,src=spoken?source.entries[spoken]:undefined;
  const offlineValid=!!spoken&&valid(spoken,r,join(root,'mobile-public/offline/recordings'),true);
  const sourceValid=!!spoken&&valid(spoken,src,join(root,'data/pronunciation'),false);
  const requirement=recordingRequirement(e.headword,exemptions.entries as Record<string,AudioExemption>);
  return {key:e.key,word:w?.headword??null,id:w?.id??null,spoken,requirement,audioRequired:requirement==='word',books:e.memberships.filter((m:any)=>m.bookId.startsWith('pep2019-')).map((m:any)=>({bookId:m.bookId,unitId:m.unitId})),placeholder:!!w&&hasDictionaryPlaceholder(w.headword),offlineValid,sourceValid,accent:offlineValid?r.accent:null,sourceUrl:offlineValid?r.sourceUrl:null,note:offlineValid?r.pronunciationNote??null:null,metadataOnly:!!r&&!offlineValid};
 });
 const count=(f:(r:any)=>boolean)=>rows.filter(f).length;
 const stats={total:rows.length,mappingMissing:count(r=>!r.word),offlineValid:count(r=>r.offlineValid),sourceValid:count(r=>r.sourceValid),offlineMissing:count(r=>!!r.word&&!r.offlineValid),sourceOnly:count(r=>r.sourceValid&&!r.offlineValid),offlineOnly:count(r=>r.offlineValid&&!r.sourceValid),placeholder:count(r=>r.placeholder),missingPlaceholder:count(r=>r.placeholder&&!r.offlineValid),accents:Object.fromEntries(['us','uk','unknown'].map(a=>[a,count(r=>r.offlineValid&&r.accent===a)]))};
 if(args.length)writeFileSync(resolve(args[1]),JSON.stringify(rows.filter((r:any)=>!r.offlineValid),null,2)+'\n',{flag:'wx'});
 const requiredAudio={required:count(r=>r.audioRequired),valid:count(r=>r.audioRequired&&r.offlineValid),missing:count(r=>r.audioRequired&&!r.offlineValid),exempt:count(r=>!r.audioRequired),exemptMissing:count(r=>!r.audioRequired&&!r.offlineValid),missingByReason:Object.fromEntries(['phrase','abbreviation','proper-name','transliteration'].map(reason=>[reason,count(r=>r.requirement===reason&&!r.offlineValid)]))};
 console.log(JSON.stringify({catalogVersion:cat.version,stats,requiredAudio,scope:'catalog high-school entries resolved against built offline seed; required audio excludes phrases and explicitly reviewed non-words; metadata and SHA-256 only; not a listening, decode or license audit'},null,2));
}finally{db.close();}
