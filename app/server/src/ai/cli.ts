import path from 'node:path';
import { pathToFileURL } from 'node:url';
export function args(argv=process.argv.slice(2)) {const out:Record<string,string|boolean>={};for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--'))out[argv[i].slice(2)]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;else if(!out.command)out.command=argv[i];else throw new Error(`unexpected argument ${argv[i]}`);}return out;}
export function required(a:Record<string,string|boolean>,key:string) {if(typeof a[key]!=='string')throw new Error(`--${key} required`);return a[key] as string;}
export function isMain(url:string) {return !!process.argv[1]&&url===pathToFileURL(path.resolve(process.argv[1])).href;}
export async function cli(fn:()=>unknown|Promise<unknown>) {try{const result=await fn();if(result!==undefined)process.stdout.write(typeof result==='string'?result+'\n':JSON.stringify(result,null,2)+'\n');}catch(e){process.stderr.write((e as Error).message+'\n');process.exitCode=1;}}
