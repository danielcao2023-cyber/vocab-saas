import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createMobileSeed} from './mobile-seed.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'mobile-public');
// The only generated directory removed here; never traverse the application data directory.
fs.rmSync(output,{recursive:true,force:true});
const assets=path.join(output,'offline');fs.mkdirSync(path.join(assets,'recordings'),{recursive:true});fs.mkdirSync(path.join(assets,'lessons'),{recursive:true});
const seed=createMobileSeed(process.env.MOBILE_SOURCE_DB??path.join(root,'data/dev-vocab.db'),path.join(assets,'seed.db'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/pronunciation/manifest.json'),'utf8'));
const recordings:Record<string,any>={};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
for(const [word,raw] of Object.entries(manifest.entries??{})){
 const r=raw as any;if(r.word!==word||!['us','uk','unknown'].includes(r.accent)||!/^[-\w]+\.mp3$/.test(r.file)||!r.author||!r.license)continue;
 if(![r.sourceUrl,r.licenseUrl].every((s:unknown)=>typeof s==='string'&&s.startsWith('https://')))continue;
 const file=path.join(root,'data/pronunciation',r.file);if(!fs.existsSync(file))continue;
 const data=fs.readFileSync(file);if(createHash('sha256').update(data).digest('hex')!==r.sha256)throw new Error(`Recording integrity mismatch: ${word}`);
 fs.writeFileSync(path.join(assets,'recordings',r.file),data);
 const {file:ignored,...info}=r;recordings[word]={...info,file:`/offline/recordings/${r.file}`};
}
fs.writeFileSync(path.join(assets,'pronunciation.json'),JSON.stringify(recordings));
const rows=Object.values(recordings).sort((a:any,b:any)=>a.word.localeCompare(b.word)).map((r:any)=>`<tr id="${escape(r.word)}"><td>${escape(r.word)}</td><td>${escape(r.author)}</td><td><a href="${escape(r.sourceUrl)}">原始录音</a></td><td><a href="${escape(r.licenseUrl)}">${escape(r.license)}</a></td></tr>`).join('');
fs.writeFileSync(path.join(assets,'credits.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>录音来源</title><style>body{font:16px/1.8 system-ui;padding:16px;color:#172536}table{border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd}a{color:#303fc0}</style><h1>录音来源</h1><p>真人录音转为 MP3 随应用离线提供，保留原许可。点击来源与许可需要联网。</p><table><tr><th>单词</th><th>作者</th><th>来源</th><th>许可</th></tr>${rows}</table></html>`);
let lessons=0;
for(const name of fs.readdirSync(path.join(root,'data/lessons'))){
 if(!/^[1-9]\d*\.json$/.test(name))continue;
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/lessons',name),'utf8'));
 if(data.wordId!==Number(name.slice(0,-5))||data.editorial?.status!=='reviewed')throw new Error(`Unreviewed or mismatched lesson: ${name}`);
 fs.writeFileSync(path.join(assets,'lessons',name),JSON.stringify(data));lessons++;
}
if(lessons!==1600)throw new Error('Mobile bundle requires all 1600 reviewed lessons');
fs.copyFileSync(path.join(root,'node_modules/sql.js/dist/sql-wasm.wasm'),path.join(assets,'sql-wasm.wasm'));
const licenses=[['sql.js','node_modules/sql.js/LICENSE'],['Capacitor','node_modules/@capacitor/core/LICENSE'],['ts-fsrs','node_modules/ts-fsrs/LICENSE']].map(([name,file])=>name+'\n'+fs.readFileSync(path.join(root,file),'utf8')).join('\n\n');
fs.writeFileSync(path.join(assets,'THIRD-PARTY-NOTICES.txt'),licenses+'\nCMUdict pronunciation source: https://github.com/cmusphinx/cmudict\n');
fs.writeFileSync(path.join(assets,'bundle.json'),JSON.stringify({version:1,seed,lessons,recordings:Object.keys(recordings).length,personalState:'empty',modelProfiles:0,dialogs:0},null,2));
fs.copyFileSync(path.join(root,'data/vocabulary/catalog.json'),path.join(assets,'vocabulary.json'));
console.log(JSON.stringify({seed,lessons,recordings:Object.keys(recordings).length,output}));
