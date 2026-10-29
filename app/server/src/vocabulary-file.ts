import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {installVocabulary,type Catalog} from './vocabulary-import.ts';
import type {DB} from './db.ts';
export const vocabularyFile=fileURLToPath(new URL('../../data/vocabulary/catalog.json',import.meta.url));
export function bundledVocabularyDigest(){return createHash('sha256').update(fs.readFileSync(vocabularyFile)).digest('hex');}
export function bundledVocabularyVersion(){const version=JSON.parse(fs.readFileSync(vocabularyFile,'utf8')).version;if(!Number.isSafeInteger(version)||version<1||version>999)throw Error('词库版本无效。');return version as number;}
/** Fail before any migration or backup. An older program must not overwrite newer data. */
export function assertVocabularyVersionCompatible(db:DB,version:number){
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='vocabulary_meta'").get())return;
 const raw=(db.prepare("SELECT value FROM vocabulary_meta WHERE key='catalog_version'").get() as {value:string}|undefined)?.value;
 if(raw===undefined)return;
 if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)<1)throw Error('学习数据库中的词库版本无效，请保留原始数据。');
 if(Number(raw)>version)throw Error(`学习数据库的词库版本 ${raw} 较新，当前程序仅支持版本 ${version}；请使用新版应用，保留现有数据。`);
}
export const VOCABULARY_VERSION_GUARD='vocabulary_catalog_version_monotonic';
export function hasVocabularyVersionGuard(db:DB){return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='trigger' AND name=?").get(VOCABULARY_VERSION_GUARD);}
function installVersionGuard(db:DB){db.exec(`CREATE TRIGGER IF NOT EXISTS vocabulary_catalog_version_monotonic
 BEFORE UPDATE OF value ON vocabulary_meta
 WHEN OLD.key='catalog_version' AND (NEW.value='' OR NEW.value GLOB '*[^0-9]*' OR CAST(NEW.value AS INTEGER)<CAST(OLD.value AS INTEGER))
 BEGIN SELECT RAISE(ABORT,'当前程序的词库版本较旧，请使用新版应用并保留学习数据。'); END`);}
export function installBundledVocabulary(db:DB){
 const bytes=fs.readFileSync(vocabularyFile),digest=createHash('sha256').update(bytes).digest('hex');
 const catalog=JSON.parse(bytes.toString()) as Catalog;assertVocabularyVersionCompatible(db,catalog.version);
 if((db.prepare("SELECT value FROM vocabulary_meta WHERE key='bundle_digest'").get() as {value:string}|undefined)?.value===digest){if(!hasVocabularyVersionGuard(db))db.transaction(()=>installVersionGuard(db))();return false;}
 db.transaction(()=>{installVersionGuard(db);installVocabulary(db,catalog);db.prepare("INSERT INTO vocabulary_meta(key,value) VALUES('bundle_digest',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(digest);})();return true;
}
