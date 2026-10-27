import fs from 'node:fs';
import path from 'node:path';
import {validateLesson} from '../server/src/lessons.ts';
type PublicWord={id:number;headword:string;source:string};
/** Preserve all core lessons while allowing reviewed catalog expansions. Never bundle orphaned/draft content. */
export function copyReviewedLessons(directory:string,output:string,words:PublicWord[]):number{
 const byId=new Map(words.map(w=>[w.id,w]));
 for(const word of words.filter(w=>w.source==='kb2022'))if(!fs.existsSync(path.join(directory,word.id+'.json')))throw Error('Missing core lesson '+word.id);
 let count=0;
 for(const file of fs.readdirSync(directory).filter(name=>/^[1-9]\d*\.json$/.test(name))){
  const id=Number(file.slice(0,-5)),word=byId.get(id);if(!word)throw Error('Unknown public lesson '+id);
  const data=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
  const result=validateLesson(data,word);if(!result.ok||data.editorial.status!=='reviewed')throw Error('Invalid or unreviewed lesson '+id);
  fs.writeFileSync(path.join(output,file),JSON.stringify(data));count++;
 }
 return count;
}
