import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import {applySheet,approveJob,hideContent,reviewStats,writeSample} from '../server/src/ai/review.ts';
import {projectRoot} from '../server/src/ai/codex-runner.ts';
import {args,required,isMain,cli,dbArg } from '../server/src/ai/cli.ts';
import {importEditorContent,applyCorrections} from '../server/src/ai/editor.ts';
import {applyWordPatches} from '../server/src/ai/word-patches.ts';
if(isMain(import.meta.url))cli(()=>{const a=args();const db=new Database(dbArg(a),{readonly:!a.yes,fileMustExist:true});try{switch(a.command){case 'sample':if(!a.job&&!a.since)throw new Error('--job or --since required');return writeSample(db,path.join(projectRoot(),'app/qa/ai-review'),{job:a.job?Number(a.job):undefined,since:typeof a.since==='string'?a.since:undefined});case 'apply':return applySheet(db,fs.readFileSync(required(a,'sheet'),'utf8'),!!a.yes);case 'import-editor':return importEditorContent(db,JSON.parse(fs.readFileSync(required(a,'manifest'),'utf8')),JSON.parse(fs.readFileSync(required(a,'content'),'utf8')),!!a.yes);case 'correct':return applyCorrections(db,JSON.parse(fs.readFileSync(required(a,'corrections'),'utf8')),!!a.yes);case 'patch-words':return applyWordPatches(db,JSON.parse(fs.readFileSync(required(a,'patches'),'utf8')),!!a.yes);case 'approve':return approveJob(db,Number(required(a,'job')),!!a.yes);case 'hide':return hideContent(db,Number(required(a,'content')),required(a,'reason'),!!a.yes);case 'stats':return reviewStats(db);default:throw new Error('expected sample/apply/import-editor/correct/patch-words/approve/hide/stats');}}finally{db.close();}});
