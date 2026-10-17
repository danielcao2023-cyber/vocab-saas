import { it,expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb } from '../server/src/db.ts';
import { verifyMigration } from '../scripts/verify-migration.ts';
import { seeded } from './v3-helpers.ts';
function legacy(file:string){
  const db=new Database(file);db.exec(fs.readFileSync('test/fixtures/schema-b4429a2.sql','utf8'));
  const rng=seeded();
  for(let i=1;i<=3;i++) {
    db.prepare('INSERT INTO words(headword,meaning_zh,source) VALUES (?,?,?)').run('word'+i,'n. 词'+i,'t');
    db.prepare("INSERT INTO cards(id,word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,state) VALUES (?,?,'recognize',?,30,5,2,3,10,2,2)").run(i,i,'2026-10-20T00:00:00Z');
    db.prepare('INSERT INTO wrong_words VALUES (?,?,?,?,?)').run(i,3,'2026-10-16T01:00:00Z','["2026-10-15"]',i===3?'2026-10-16T01:00:00Z':null);
    for(let j=1;j<=10;j++)db.prepare('INSERT INTO review_logs(card_id,rating,state,due,stability,difficulty,elapsed_days,scheduled_days,review_at,duration_ms,answer,correct,answer_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(i,1+Math.floor(rng()*4),j===1?0:2,`2026-10-${String(j).padStart(2,'0')}T00:00:00Z`,rng()*30,5,1,2,`2026-10-${String(j).padStart(2,'0')}T01:00:00Z`,Math.floor(rng()*500000),'word'+i,j%2,`${i}-${j}`);
  }
  db.prepare("UPDATE settings SET value='3' WHERE key='new_per_day'").run();db.close();
}
const tables=['words','cards','review_logs','wrong_words','settings'];
it('additive migrations twice preserve every old field, NULL new log columns and due dates; dry run and verifier preserve original bytes',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-v3-'));
  const file=path.join(dir,'legacy.sqlite');
  try {
    legacy(file);const originalBytes=fs.readFileSync(file);const old=new Database(file,{readonly:true});
    const before=tables.map(t=>old.prepare(`SELECT * FROM ${t}`).all() as Record<string,unknown>[]);old.close();
    const dry=openDb(file,{dryRun:true});expect(dry.prepare('SELECT COUNT(*) n FROM daily_stats').get()).toEqual({n:10});dry.close();expect(fs.readFileSync(file)).toEqual(originalBytes);
    const cli=JSON.parse(execFileSync(process.execPath,['--import','tsx','scripts/verify-migration.ts','--db',file],{encoding:'utf8'}));expect(cli.oldColumnsUnchanged).toBe(true);expect(fs.readFileSync(file)).toEqual(originalBytes);
    const report=verifyMigration(file);expect(report.oldColumnsUnchanged).toBe(true);expect(report.integrity_check).toBe('ok');expect(report.dailyStatsRows).toBe(10);expect(fs.readFileSync(file)).toEqual(originalBytes);
    for(let iteration=0;iteration<2;iteration++) {
      const db=openDb(file);
      for(let i=0;i<tables.length;i++) {
        const columns=Object.keys(before[i][0]);const rows=db.prepare(`SELECT ${columns.join(',')} FROM ${tables[i]}`).all() as Record<string,unknown>[];
        expect(tables[i]==='settings'?rows.filter(r=>before[i].some(old=>old.key===r.key)):rows).toEqual(before[i]);
      }
      expect(db.prepare('SELECT DISTINCT qtype,counted,context FROM review_logs').all()).toEqual([{qtype:null,counted:null,context:null}]);
      expect(db.prepare('SELECT COUNT(*) n FROM settings').get()).toEqual({n:9});expect(db.prepare('SELECT COUNT(*) n FROM daily_stats').get()).toEqual({n:10});expect(db.pragma('integrity_check',{simple:true})).toBe('ok');db.close();
    }
  } finally{fs.rmSync(dir,{recursive:true,force:true});}
});
