import Database from 'better-sqlite3';
import { readEcdict,importForms } from '../server/src/freq.ts';
import { args,required,isMain,cli } from '../server/src/ai/cli.ts';
import { createCodexRunner } from '../server/src/ai/codex-runner.ts';
import { runPipeline } from '../server/src/ai/pipeline.ts';
export { runPipeline } from '../server/src/ai/pipeline.ts';
if(isMain(import.meta.url))cli(async()=>{
  const a=args(),file=required(a,'db'),csv=required(a,'ecdict');readEcdict(csv);
  if(a.kind&&!['content','zk_freq'].includes(String(a.kind)))throw new Error('invalid --kind');
  const db=new Database(file,{readonly:!!a['dry-run'],fileMustExist:true});let stop=false;const interrupt=()=>{stop=true;};process.on('SIGINT',interrupt);
  try {if(!a['dry-run'])importForms(db,csv);return await runPipeline(db,{kind:(a.kind??'content') as 'content'|'zk_freq',batch:a.batch?Number(a.batch):undefined,limit:a.limit?Number(a.limit):undefined,words:typeof a.words==='string'?a.words.split(',').map(w=>w.trim()).filter(Boolean):undefined,pilot:!!a.pilot,dryRun:!!a['dry-run'],retryFailed:!!a['retry-failed'],reconcile:!!a.reconcile,shouldStop:()=>stop,log:line=>process.stdout.write(line+'\n')},createCodexRunner());}
  finally{db.close();process.removeListener('SIGINT',interrupt);}
});
