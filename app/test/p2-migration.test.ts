import {it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {openDb,migratePhase2} from '../server/src/db.ts';
import {verifyMigration} from '../scripts/verify-migration.ts';
import {snapshot,temp} from './p2-helpers.ts';
it('phase-two additions are repeatable and preserve every old row/column including unused content tables',()=>{
  const dir=temp(),file=path.join(dir,'legacy.sqlite');
  try{const old=new Database(file);old.exec(fs.readFileSync('test/fixtures/schema-b4429a2.sql','utf8'));old.exec("INSERT INTO words(id,headword,source) VALUES (1,'go','kb2022'); INSERT INTO word_content(word_id,kind,body_json) VALUES (1,'example','[]'); INSERT INTO content_feedback(word_id,reason) VALUES (1,'other'); INSERT INTO ai_jobs(kind,status) VALUES ('legacy','pending'); INSERT INTO ai_cache VALUES ('old',1,'q','a','2026');");old.close();
    const report=verifyMigration(file);expect(report.oldColumnsUnchanged).toBe(true);expect(report.addedTables).toEqual(expect.arrayContaining(['word_forms','word_freq']));for(const t of ['word_content','content_feedback','ai_jobs','ai_cache'])expect(report.tables).toHaveProperty(t);
    const db=openDb(file);const before=snapshot(db);migratePhase2(db);migratePhase2(db);expect(snapshot(db)).toEqual(before);expect(db.prepare("SELECT value FROM settings WHERE key='ai_model'").get()).toEqual({value:'gpt-6-luna'});expect((db.prepare('PRAGMA table_info(word_content)').all() as any[]).map(c=>c.name)).toEqual(expect.arrayContaining(['hidden_at','approved_at','input_hash']));db.close();
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
