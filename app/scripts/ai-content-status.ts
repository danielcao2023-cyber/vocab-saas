import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import {args,dbArg,isMain,cli} from '../server/src/ai/cli.ts';
import {protectTarget} from '../server/src/guard.ts';
import {contentCoverage} from '../server/src/ai/coverage.ts';
if(isMain(import.meta.url))cli(()=>{
  const a=args(),db=new Database(dbArg(a),{readonly:true,fileMustExist:true});
  try {const report=contentCoverage(db);if(typeof a.out==='string'){protectTarget(a.out);fs.mkdirSync(path.dirname(path.resolve(a.out)),{recursive:true});fs.writeFileSync(a.out,JSON.stringify(report,null,2)+'\n');}const {entries,missingCore,...summary}=report;return {...summary,missingCoreCount:missingCore.length,missingCoreSample:missingCore.slice(0,20),...(typeof a.out==='string'?{out:path.resolve(a.out)}:{})};}finally{db.close();}
});
