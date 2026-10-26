import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {installVocabulary,type Catalog} from './vocabulary-import.ts';
import type {DB} from './db.ts';
export const vocabularyFile=fileURLToPath(new URL('../../data/vocabulary/catalog.json',import.meta.url));
export function bundledVocabularyDigest(){return createHash('sha256').update(fs.readFileSync(vocabularyFile)).digest('hex');}
export function installBundledVocabulary(db:DB){
 const bytes=fs.readFileSync(vocabularyFile),digest=createHash('sha256').update(bytes).digest('hex');
 if((db.prepare("SELECT value FROM vocabulary_meta WHERE key='bundle_digest'").get() as {value:string}|undefined)?.value===digest)return false;
 db.transaction(()=>{installVocabulary(db,JSON.parse(bytes.toString()) as Catalog);db.prepare("INSERT INTO vocabulary_meta(key,value) VALUES('bundle_digest',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(digest);})();return true;
}
