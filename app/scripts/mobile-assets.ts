import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Database from 'better-sqlite3';
import {protectTarget} from '../server/src/guard.ts';
import {copyReviewedLessons} from './lesson-assets.ts';
import {createMobileSeed} from './mobile-seed.ts';
import {packPronunciations} from './mobile-pronunciation-assets.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'mobile-public');
// The only generated directory removed here; never traverse the application data directory.
fs.rmSync(output,{recursive:true,force:true});
const assets=path.join(output,'offline');fs.mkdirSync(path.join(assets,'recordings'),{recursive:true});fs.mkdirSync(path.join(assets,'lessons'),{recursive:true});
const seed=createMobileSeed(process.env.MOBILE_SOURCE_DB??path.join(root,'data/dev-vocab.db'),path.join(assets,'seed.db'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/pronunciation/manifest.json'),'utf8'));
const {recordings,credits:rows}=packPronunciations(manifest,path.join(root,'data/pronunciation'),path.join(assets,'recordings'));
fs.writeFileSync(path.join(assets,'pronunciation.json'),JSON.stringify(recordings));
fs.writeFileSync(path.join(assets,'credits.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>录音来源</title><style>body{font:16px/1.8 system-ui;padding:16px;color:#172536}table{border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd}a{color:#303fc0}</style><h1>录音来源</h1><p>真人录音转为 MP3 随应用离线提供，保留原许可。点击来源与许可需要联网。</p><table><tr><th>单词</th><th>作者</th><th>来源</th><th>许可</th></tr>${rows}</table></html>`);
const publicSeedPath=path.join(assets,'seed.db');protectTarget(publicSeedPath);
const publicDb=new Database(publicSeedPath,{readonly:true});
let lessons:number;
try{lessons=copyReviewedLessons(path.join(root,'data/lessons'),path.join(assets,'lessons'),publicDb.prepare('SELECT id,headword,source FROM words').all() as {id:number;headword:string;source:string}[]);}finally{publicDb.close();}
fs.copyFileSync(path.join(root,'node_modules/sql.js/dist/sql-wasm.wasm'),path.join(assets,'sql-wasm.wasm'));
const licenses=[['sql.js','node_modules/sql.js/LICENSE'],['Capacitor','node_modules/@capacitor/core/LICENSE'],['ts-fsrs','node_modules/ts-fsrs/LICENSE']].map(([name,file])=>name+'\n'+fs.readFileSync(path.join(root,file),'utf8')).join('\n\n');
fs.writeFileSync(path.join(assets,'THIRD-PARTY-NOTICES.txt'),licenses+'\nCMUdict pronunciation source: https://github.com/cmusphinx/cmudict\n');
fs.writeFileSync(path.join(assets,'bundle.json'),JSON.stringify({version:1,seed,lessons,recordings:Object.keys(recordings).length,personalState:'empty',modelProfiles:0,dialogs:0},null,2));
fs.copyFileSync(path.join(root,'data/vocabulary/catalog.json'),path.join(assets,'vocabulary.json'));
console.log(JSON.stringify({seed,lessons,recordings:Object.keys(recordings).length,output}));
