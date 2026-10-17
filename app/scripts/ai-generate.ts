import Database from 'better-sqlite3';
import fs from 'node:fs';
import { readEcdict,importForms } from '../server/src/freq.ts';
import { args,isMain,cli,dbArg } from '../server/src/ai/cli.ts';
import { createCodexRunner,type Runner } from '../server/src/ai/codex-runner.ts';
import { fakeRunner } from '../server/src/ai/fake-runner.ts';
import { runPipeline } from '../server/src/ai/pipeline.ts';
import type { ContentProfile } from '../server/src/ai/prompts.ts';
import { importCurriculumForms } from '../server/src/ai/forms.ts';
export { runPipeline } from '../server/src/ai/pipeline.ts';
/** 默认模拟模型；只有显式 --real 才启动 codex exec -m gpt-6-luna。 */
export function chooseRunner(a:Record<string,string|boolean>,real:()=>Runner=createCodexRunner):{fake:boolean;runner:Runner} {
  if(a.real!==undefined&&a.real!==true)throw new Error('--real takes no value');
  return a.real===true?{fake:false,runner:real()}:{fake:true,runner:fakeRunner};
}
if(isMain(import.meta.url))cli(async()=>{
  const a=args(),file=dbArg(a),csv=typeof a.ecdict==='string'?a.ecdict:undefined;
  if(a.ecdict!==undefined&&!csv)throw new Error('--ecdict requires a path');if(csv)readEcdict(csv);
  if(a.kind&&!['content','zk_freq'].includes(String(a.kind)))throw new Error('invalid --kind');
  if(a.profile&&!['full','core'].includes(String(a.profile)))throw new Error('invalid --profile');
  const db=new Database(file,{readonly:!!a['dry-run'],fileMustExist:true});const chosen=chooseRunner(a);if(chosen.fake)process.stderr.write('模拟模型（fake-model）：不调用真实模型；真实生成需加 --real\n');let stop=false;const interrupt=()=>{stop=true;};process.on('SIGINT',interrupt);
  const excluded=typeof a['exclude-manifest']==='string'?JSON.parse(fs.readFileSync(a['exclude-manifest'],'utf8')).words.map((w:{id:number})=>w.id):undefined;
  try {if(!a['dry-run']){if(csv)importForms(db,csv);importCurriculumForms(db);}return await runPipeline(db,{fake:chosen.fake,kind:(a.kind??'content') as 'content'|'zk_freq',profile:(a.profile??'full') as ContentProfile,batch:a.batch?Number(a.batch):undefined,concurrency:a.concurrency?Number(a.concurrency):undefined,limit:a.limit?Number(a.limit):undefined,words:typeof a.words==='string'?a.words.split(',').map(w=>w.trim()).filter(Boolean):undefined,excludeWordIds:excluded,pilot:!!a.pilot,dryRun:!!a['dry-run'],retryFailed:!!a['retry-failed'],reconcile:!!a.reconcile||!!a['reconcile-only'],shouldStop:()=>stop||!!a['reconcile-only'],log:line=>process.stdout.write(line+'\n')},chosen.runner);}
  finally{db.close();process.removeListener('SIGINT',interrupt);}
});
