import {createEmptyCard,fsrs,Rating} from 'ts-fsrs';
import type {DB} from '../db.ts';
import {shDay} from '../time.ts';
export const EVIDENCE_SCHEMA=`
CREATE TABLE IF NOT EXISTS learning_events (
 id INTEGER PRIMARY KEY,event_key TEXT NOT NULL UNIQUE,word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
 mode TEXT NOT NULL CHECK(mode IN ('recognize','spell','dictation')),issue_id TEXT,
 kind TEXT NOT NULL CHECK(kind IN ('probe_success','probe_failure','exposure','correction','technical_defer')),
 occurred_at TEXT NOT NULL,text_correct INTEGER,eligible INTEGER NOT NULL DEFAULT 0,rating INTEGER CHECK(rating IN (1,3)),reason TEXT NOT NULL,
 source TEXT NOT NULL CHECK(source IN ('live','legacy_verified','legacy_unknown')),review_log_id INTEGER REFERENCES review_logs(id) ON DELETE SET NULL,
 delayed INTEGER NOT NULL DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_probe ON learning_events(issue_id) WHERE kind IN ('probe_success','probe_failure') AND issue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_word_time ON learning_events(word_id,occurred_at);
CREATE TABLE IF NOT EXISTS learning_card_state (
 card_id INTEGER PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,verification_due TEXT,verification_required INTEGER NOT NULL DEFAULT 1,
 last_attempt_at TEXT,last_failure_at TEXT,delayed_successes INTEGER NOT NULL DEFAULT 0,recovery_days TEXT NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS learning_policy_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS learning_v3_snapshots (
 id INTEGER PRIMARY KEY,kind TEXT NOT NULL,entity_id TEXT NOT NULL,body_json TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(kind,entity_id));
`;
export function migrateEvidenceSchema(db:DB){db.exec(EVIDENCE_SCHEMA);}
export function evidenceVersion(db:DB):2|3 {
 const table=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='learning_policy_meta'").get();
 return table&&(db.prepare("SELECT value FROM learning_policy_meta WHERE key='version'").get() as {value:string}|undefined)?.value==='3'?3:2;
}
export interface MigrationReport {version:3;affectedCards:number;preservedLogs:number;verifiedEvents:number;unknownCards:number}
/** Call only after a verified durable backup. No activation on an HTTP read. */
export function activateEvidencePolicy(db:DB,now:Date):MigrationReport {
 migrateEvidenceSchema(db);
 const report=():MigrationReport=>JSON.parse((db.prepare("SELECT value FROM learning_policy_meta WHERE key='migration_report'").get() as {value:string}).value);
 if(evidenceVersion(db)===3)return report();
 return db.transaction(()=>{
  const stamp=now.toISOString();
  for(const table of ['cards','learning_words','learning_day_words'])for(const row of db.prepare(`SELECT * FROM ${table}`).all() as any[]){
   const id=table==='cards'?String(row.id):table==='learning_words'?String(row.word_id):row.day+':'+row.word_id;
   db.prepare('INSERT INTO learning_v3_snapshots(kind,entity_id,body_json,created_at) VALUES (?,?,?,?)').run(table,id,JSON.stringify(row),stamp);
  }
  let affected=0,verified=0,unknown=0;
  const scheduler=fsrs({request_retention:.9,enable_fuzz:false,learning_steps:[],relearning_steps:[]});
  for(const c of db.prepare('SELECT * FROM cards').all() as any[]){
   // Only explicit help/wrong evidence can establish a failure. Unassisted legacy successes remain unknown.
   const issues=db.prepare('SELECT * FROM learning_issues WHERE word_id=? AND mode=? AND (assisted=1 OR json_extract(result_json,\'$.correct\')=0) ORDER BY issued_at,id').all(c.word_id,c.mode) as any[];
   const logs=db.prepare('SELECT * FROM review_logs WHERE card_id=? AND (rating=1 OR rating=2 OR correct=0) ORDER BY review_at,id').all(c.id) as any[];
   const failures=[...issues.map(i=>({at:i.answered_at??i.issued_at,key:'legacy-issue:'+i.id,issue:i.id,log:null as number|null,help:!!i.assisted})),...logs.filter(l=>!issues.some(i=>i.answer_id===l.answer_id&&l.answer_id)).map(l=>({at:l.review_at,key:'legacy-log:'+l.id,issue:null as string|null,log:l.id as number|null,help:l.rating===2}))].sort((a,b)=>a.at.localeCompare(b.at));
   for(const f of failures){db.prepare('INSERT OR IGNORE INTO learning_events(event_key,word_id,mode,issue_id,kind,occurred_at,text_correct,eligible,rating,reason,source,review_log_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(f.key,c.word_id,c.mode,f.issue,'probe_failure',f.at,null,1,1,f.help?'help':'wrong','legacy_verified',f.log);verified++;}
   const last=failures.at(-1)?.at??null;
   if(last){
    const card=scheduler.next(createEmptyCard(new Date(last)),new Date(last),Rating.Again).card;
    db.prepare('UPDATE cards SET due=?,stability=?,difficulty=?,elapsed_days=?,scheduled_days=?,learning_steps=?,reps=?,lapses=?,state=?,last_review=? WHERE id=?').run(card.due.toISOString(),card.stability,card.difficulty,card.elapsed_days,card.scheduled_days,card.learning_steps,card.reps,card.lapses,card.state,last,c.id);affected++;
   }else if(c.reps>0)unknown++;
   db.prepare('INSERT OR IGNORE INTO learning_card_state(card_id,verification_due,last_attempt_at,last_failure_at) VALUES (?,?,?,?)').run(c.id,c.reps>0||last?stamp:null,last,last);
  }
  // Old issues cannot become new probes. Stored results remain byte-identical for replay.
  db.prepare('UPDATE learning_issues SET answered_at=? WHERE answered_at IS NULL').run(stamp);
  db.prepare('UPDATE learning_days SET policy_version=3').run();
  db.prepare('UPDATE learning_day_words SET done=0,deferred=0,available_at=? WHERE day=?').run(stamp,shDay(now));
  const result:MigrationReport={version:3,affectedCards:affected,preservedLogs:(db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n,verifiedEvents:verified,unknownCards:unknown};
  db.prepare("INSERT INTO learning_policy_meta(key,value) VALUES ('version','3'),('activated_at',?),('migration_report',?)").run(stamp,JSON.stringify(result));
  return result;
 })();
}
