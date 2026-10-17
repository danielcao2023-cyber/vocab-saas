import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import {applySheet,approveJob,hideContent,reviewStats,writeSample} from '../server/src/ai/review.ts';
import {projectRoot} from '../server/src/ai/codex-runner.ts';
import {args,required,isMain,cli} from '../server/src/ai/cli.ts';
if(isMain(import.meta.url))cli(()=>{const a=args();const db=new Database(required(a,'db'),{readonly:!a.yes,fileMustExist:true});try{switch(a.command){case 'sample':if(!a.job&&!a.since)throw new Error('--job or --since required');return writeSample(db,path.join(projectRoot(),'app/qa/ai-review'),{job:a.job?Number(a.job):undefined,since:typeof a.since==='string'?a.since:undefined});case 'apply':return applySheet(db,fs.readFileSync(required(a,'sheet'),'utf8'),!!a.yes);case 'approve':return approveJob(db,Number(required(a,'job')),!!a.yes);case 'hide':return hideContent(db,Number(required(a,'content')),required(a,'reason'),!!a.yes);case 'stats':return reviewStats(db);default:throw new Error('expected sample/apply/approve/hide/stats');}}finally{db.close();}});
