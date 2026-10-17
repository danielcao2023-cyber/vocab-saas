import { spawn, type SpawnOptions } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
export const MODEL='gpt-6-luna' as const;
export const projectRoot=()=>path.join(os.homedir(),'dev/vocab-saas');
export interface RunnerRequest {prompt:string;schema:object;jobId:number;directory:string;timeoutMs:number}
export interface RunnerResult {stdout:string;exitCode:number|null;durationMs:number;timedOut?:boolean;error?:string}
export type Runner=(req:RunnerRequest)=>Promise<RunnerResult>;
export function detectFlags(helpText:string) {return {schema:/(?:^|\s)--output-schema(?:\s|[=<\[]|$)/m.test(helpText),lastMessage:/(?:^|\s)--output-last-message(?:\s|[=<\[]|$)/m.test(helpText)};}
export function commandArgs(req:RunnerRequest,flags:ReturnType<typeof detectFlags>) {
  return ['exec','-m',MODEL,'--sandbox','read-only','--skip-git-repo-check','-C',projectRoot(),...(flags.lastMessage?['--output-last-message',path.join(req.directory,'output.json')]:[]),...(flags.schema?['--output-schema',path.join(req.directory,'schema.json')]:[]),req.prompt];
}
export const spawnOptions:SpawnOptions={stdio:['ignore','pipe','pipe']};
/** No shell, environment overrides, or configuration changes. Output/stderr never logs environment. */
export function runProcess(args:string[],timeoutMs:number,spawnFn:typeof spawn=spawn):Promise<RunnerResult> {
  return new Promise(resolve=>{const started=Date.now();let stdout='',timedOut=false,done=false,kill:ReturnType<typeof setTimeout>|undefined;let error:string|undefined;
    const child=spawnFn('/opt/homebrew/bin/codex',args,spawnOptions);
    child.stdout?.on('data',chunk=>{stdout+=chunk.toString();});
    // Drain stderr without recording it: external tools could emit credentials.
    child.stderr?.on('data',()=>{});
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');kill=setTimeout(()=>child.kill('SIGKILL'),10000);},timeoutMs);
    const finish=(exitCode:number|null)=>{if(done)return;done=true;clearTimeout(timer);clearTimeout(kill);resolve({stdout,exitCode,durationMs:Date.now()-started,timedOut,error:timedOut?'timeout':error});};
    child.on('error',()=>{error='process spawn failed';finish(null);});child.on('close',finish);
  });
}
export function createCodexRunner():Runner {
  let flags:ReturnType<typeof detectFlags>|undefined;
  return async req=>{
    if(!flags){const help=await runProcess(['exec','-m',MODEL,'--help'],30000);if(help.exitCode!==0)throw new Error('could not detect exec flags');flags=detectFlags(help.stdout);}
    fs.mkdirSync(req.directory,{recursive:true});fs.writeFileSync(path.join(req.directory,'prompt.txt'),req.prompt);fs.writeFileSync(path.join(req.directory,'schema.json'),JSON.stringify(req.schema));
    const output=path.join(req.directory,'output.json');fs.rmSync(output,{force:true});const result=await runProcess(commandArgs(req,flags),req.timeoutMs);
    if(flags.lastMessage&&fs.existsSync(output))result.stdout=fs.readFileSync(output,'utf8');else fs.writeFileSync(output,result.stdout);
    return result;
  };
}
/** Last balanced JSON object, ignoring braces inside quoted strings and nested objects. */
export function extractJson(text:string):any {
  try{return JSON.parse(text);}catch{/* CLI may surround final JSON with text */}
  let last:any;let depth=0,start=-1,quoted=false,escaped=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}if(c==='"'&&depth){quoted=true;continue;}if(c==='{'){if(depth++===0)start=i;}else if(c==='}'&&depth&&--depth===0){try{last=JSON.parse(text.slice(start,i+1));}catch{/* continue */}}}
  if(last===undefined)throw new Error('invalid JSON output');return last;
}
