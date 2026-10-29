import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import Database from 'better-sqlite3';
import {protectTarget,readSnapshot,verifiedBackup} from './guard.ts';
import {activateEvidencePolicy,evidenceVersion} from './learning/evidence-migration.ts';
import { openDb } from './db.ts';
import { buildApp } from './app.ts';
import {installBundledVocabulary,bundledVocabularyDigest} from './vocabulary-file.ts';
import { ConfigError, parseCidrs, parseHosts, parsePort, startListeners } from './net.ts';

let hosts: string[], port: number, allow;
try {
  hosts = parseHosts(process.env.HOST);
  port = parsePort(process.env.PORT);
  allow = parseCidrs(process.env.ALLOW_CIDRS);
} catch (e) {
  if (e instanceof ConfigError) { console.error(`配置错误：${e.message}`); process.exit(2); }
  throw e;
}
const file=process.env.DB_PATH ?? 'data/vocab.db';
protectTarget(file);
if(file!==':memory:'&&fs.existsSync(file)){
 const bytes=Buffer.from(readSnapshot(file));bytes[18]=1;bytes[19]=1;
 const snapshot=new Database(bytes);let version,catalogChanged,dictationUpgrade;
 try{
  version=evidenceVersion(snapshot);
  const exists=snapshot.prepare("SELECT 1 FROM sqlite_master WHERE name='vocabulary_meta'").get();
  const digest=exists?(snapshot.prepare("SELECT value FROM vocabulary_meta WHERE key='bundle_digest'").get() as {value:string}|undefined)?.value:undefined;
  catalogChanged=digest!==bundledVocabularyDigest();
  const issueTable=snapshot.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='learning_issues'").get();
  dictationUpgrade=!!issueTable&&!(snapshot.prepare('PRAGMA table_info(learning_issues)').all() as {name:string}[]).some(c=>c.name==='audio_variant');
 }finally{snapshot.close();}
 if(version!==3||catalogChanged||dictationUpgrade){
  const dir=path.join(os.homedir(),'.codex','backups','xiaobei',version!==3?'pre-v3':dictationUpgrade?'pre-dictation-variant':'pre-vocabulary');fs.mkdirSync(dir,{recursive:true,mode:0o700});
  await verifiedBackup(file,path.join(dir,Date.now()+'-'+randomUUID()+'.db'));
 }
}
const db=openDb(file);
installBundledVocabulary(db);
activateEvidencePolicy(db,new Date());
const app = buildApp(db, { staticDir: process.env.STATIC_DIR ?? 'dist', allow });
await app.ready();
const listeners = startListeners(hosts, port, (req, res) => app.routing(req, res));
for (const s of ['SIGINT', 'SIGTERM'] as const) process.on(s, async () => { await listeners.close(); await app.close(); db.close(); process.exit(0); });
