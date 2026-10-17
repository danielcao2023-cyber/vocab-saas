import Database from 'better-sqlite3';
import { readEcdict,importForms } from '../server/src/freq.ts';
import { args,required,isMain,cli,dbArg } from '../server/src/ai/cli.ts';
import { createCodexRunner,type Runner } from '../server/src/ai/codex-runner.ts';
import { fakeRunner } from '../server/src/ai/fake-runner.ts';
import { runPipeline } from '../server/src/ai/pipeline.ts';
export { runPipeline } from '../server/src/ai/pipeline.ts';
/** 默认模拟模型；只有显式 --real 才启动 codex exec -m gpt-6-luna。 */
export function chooseRunner(a:Record<string,string|boolean>,real:()=>Runner=createCodexRunner):{fake:boolean;runner:Runner} {
  if(a.real!==undefined&&a.real!==true)throw new Error('--real takes no value');
  return a.real===true?{fake:false,runner:real()}:{fake:true,runner:fakeRunner};
}
if(isMain(import.meta.url))cli(async()=>{
  const a=args(),file=dbArg(a),csv=required(a,'ecdict');readEcdict(csv);
  if(a.kind&&!['content','zk_freq'].includes(String(a.kind)))throw new Error('invalid --kind');
  const db=new Database(file,{readonly:!!a['dry-run'],fileMustExist:true});const chosen=chooseRunner(a);if(chosen.fake)process.stderr.write('模拟模型（fake-model）：不调用真实模型；真实生成需加 --real\n');let stop=false;const interrupt=()=>{stop=true;};process.on('SIGINT',interrupt);
  try {if(!a['dry-run'])importForms(db,csv);return await runPipeline(db,{fake:chosen.fake,kind:(a.kind??'content') as 'content'|'zk_freq',batch:a.batch?Number(a.batch):undefined,limit:a.limit?Number(a.limit):undefined,words:typeof a.words==='string'?a.words.split(',').map(w=>w.trim()).filter(Boolean):undefined,pilot:!!a.pilot,dryRun:!!a['dry-run'],retryFailed:!!a['retry-failed'],reconcile:!!a.reconcile,shouldStop:()=>stop,log:line=>process.stdout.write(line+'\n')},chosen.runner);}
  finally{db.close();process.removeListener('SIGINT',interrupt);}
});
