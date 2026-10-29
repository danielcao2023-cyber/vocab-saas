import type {DB} from './db.ts';
import identities from '../../shared/lesson-identities.generated.ts';

const index:Readonly<Record<string,{id:number;headword:string}>>=identities;
/** Resolve only a catalog-mapped key whose indexed headword exactly matches the stored word. */
export function canonicalLessonId(db:DB,word:{id:number;headword:string}):number|undefined{
 const entries=db.prepare('SELECT entry_key FROM vocabulary_entry_map WHERE word_id=?').all(word.id) as {entry_key:string}[];
 const candidates=new Set(entries.flatMap(({entry_key})=>{
  const item=Object.hasOwn(index,entry_key)?index[entry_key]:undefined;
  return item?.headword===word.headword?[item.id]:[];
 }));
 return candidates.size===1?[...candidates][0]:undefined;
}
