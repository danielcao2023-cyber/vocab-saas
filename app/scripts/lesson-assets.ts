import fs from 'node:fs';
import path from 'node:path';
import {validateLesson} from '../server/src/lessons.ts';
import {keyedLessons} from '../shared/keyed-lessons.ts';
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
 for(const [headword,file] of Object.entries(keyedLessons)){
  if(!words.some(word=>word.headword===headword))continue;
  const data=JSON.parse(fs.readFileSync(path.join(directory,'keyed',file),'utf8'));
  if(data.headword!==headword||!validateLesson(data).ok||data.editorial.status!=='reviewed')throw Error('Invalid keyed lesson '+file);
  fs.mkdirSync(path.join(output,'keyed'),{recursive:true});fs.writeFileSync(path.join(output,'keyed',file),JSON.stringify(data));count++;
 }
 if(words.some(word=>word.headword==='Log')){const data=JSON.parse(fs.readFileSync(path.join(directory,'keyed','highschool-log.json'),'utf8'));if(data.headword!=='Log'||!validateLesson(data).ok||data.editorial.status!=='reviewed')throw Error('Invalid high school log lesson');fs.mkdirSync(path.join(output,'keyed'),{recursive:true});fs.writeFileSync(path.join(output,'keyed','highschool-log.json'),JSON.stringify(data));count++;}
 return count;
}
