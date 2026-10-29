import {beforeAll,expect,it} from 'vitest';
import Database from 'better-sqlite3';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {openDb} from '../server/src/db';
import {bundledVocabularyDigest,installBundledVocabulary} from '../server/src/vocabulary-file';
import {installVocabulary} from '../server/src/vocabulary-import';
import {readSnapshot} from '../server/src/guard';
import catalog from '../data/vocabulary/catalog.json';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
const membership=catalog.entries[0].memberships[0];
const small={...catalog,books:catalog.books.filter(b=>b.id===membership.bookId),units:catalog.units.filter(u=>u.id===membership.unitId),entries:[{...catalog.entries[0],memberships:[membership]}]};
let installedImage:Buffer;
beforeAll(()=>{const db=openDb(':memory:');try{
 // The preinstalled digest exercises exactly the real guard-creation branch
 // without importing the complete production catalog into this fixture.
 db.prepare("INSERT INTO vocabulary_meta(key,value) VALUES ('bundle_digest',?)").run(bundledVocabularyDigest());
 installVocabulary(db,small);installBundledVocabulary(db);installedImage=db.serialize();
}finally{db.close()}});
function newer(db:any){db.prepare("INSERT INTO vocabulary_meta(key,value) VALUES('catalog_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(catalog.version+1));db.prepare("INSERT INTO vocabulary_meta(key,value) VALUES('bundle_digest','newer') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();}
it('refuses an older online bundle before changing any database rows',()=>{
 const db=openDb(':memory:');try{newer(db);const before=db.serialize();expect(()=>installBundledVocabulary(db)).toThrow(/版本.*较新|较新.*版本/);expect(db.serialize()).toEqual(before)}finally{db.close()}
});
it('refuses online server startup on a newer database before writing or making a backup',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'no-downgrade-')),file=path.join(dir,'user.db');try{let db=openDb(file);newer(db);db.close();const before=Buffer.from(readSnapshot(file));const run=spawnSync(process.execPath,['--import','tsx','server/src/main.ts'],{cwd:process.cwd(),env:{...process.env,DB_PATH:file,HOST:'127.0.0.1',PORT:'18479'},timeout:10000,encoding:'utf8'});expect(run.status).not.toBe(0);expect(run.stderr+run.stdout).toMatch(/版本.*较新|较新.*版本/);expect(Buffer.from(readSnapshot(file))).toEqual(before);}finally{rmSync(dir,{recursive:true,force:true})}
});
it('offline older bundle leaves a newer saved database and its records untouched',async()=>{
 const source=openDb(':memory:');newer(source);source.prepare("INSERT INTO words(headword,meaning_zh,source) VALUES ('downgrade-guard','custom','vocabulary')").run();const bytes=source.serialize();source.close();const mobile=await openBrowserDatabase(bytes);let saves=0,backups=0;try{await prepareVocabularyDatabase(mobile,catalog,{save:async()=>{saves++},createVocabularyBackup:async()=>{backups++}},true);expect(saves).toBe(0);expect(backups).toBe(0);expect(asSharedDb(mobile).prepare("SELECT meaning_zh FROM words WHERE headword='downgrade-guard'").get()).toEqual({meaning_zh:'custom'});expect(asSharedDb(mobile).prepare("SELECT value FROM vocabulary_meta WHERE key='catalog_version'").get()).toEqual({value:String(catalog.version+1)});}finally{mobile.close()}
});
it('installs a persistent guard that prevents old importer downgrade atomically',()=>{
 const db=new Database(installedImage);try{const before=db.serialize();const older={...small,version:catalog.version-1};expect(()=>installVocabulary(db,older)).toThrow(/词库版本较旧/);expect(db.serialize()).toEqual(before);expect(()=>installVocabulary(db,small)).not.toThrow();}finally{db.close()}
});
it('adds missing downgrade protection on an already installed bundle',()=>{
 const db=new Database(installedImage);try{db.exec('DROP TRIGGER IF EXISTS vocabulary_catalog_version_monotonic');expect(installBundledVocabulary(db)).toBe(false);expect(db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name='vocabulary_catalog_version_monotonic'").get()).toBeTruthy()}finally{db.close()}
});
