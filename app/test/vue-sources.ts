import fs from 'node:fs';
import path from 'node:path';
export function vueSources(dir='web/src'): {file:string;text:string}[] {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?vueSources(path.join(dir,e.name)):e.name.endsWith('.vue')?[{file:path.join(dir,e.name),text:fs.readFileSync(path.join(dir,e.name),'utf8')}]:[]);
}
