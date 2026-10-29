import type {DB} from './db.ts';
/** Display correction only; keep storage identities, answers and edited words untouched. */
export function displayHeadword(db:DB,id:number,headword:string):string {
 if(headword!=='Log')return headword;
 const mapped=db.prepare("SELECT word_id FROM vocabulary_entry_map WHERE entry_key='Log'").get() as {word_id:number}|undefined;
 return mapped?.word_id===id?'log':headword;
}
