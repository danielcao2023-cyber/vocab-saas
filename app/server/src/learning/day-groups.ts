import type {DB} from '../db.ts';
import {shDay} from '../time.ts';
import type {LearningWord} from './selection.ts';
/** Limit one explicitly related textbook pair to one new daily plan slot. Never mutate history. */
export function dedupeDayGroup(db:DB,now:Date,scope:LearningWord[],due:LearningWord[],fresh:LearningWord[]){
 const keys=['from on','from then on'];
 const mapped=db.prepare("SELECT entry_key,word_id FROM vocabulary_entry_map WHERE entry_key IN ('from on','from then on')").all() as {entry_key:string;word_id:number}[];
 if(mapped.length!==2)return {due,fresh};
 const ids=keys.map(k=>mapped.find(m=>m.entry_key===k)?.word_id);if(ids.some(id=>id===undefined)||ids[0]===ids[1]||!ids.every(id=>scope.some(w=>w.id===id)))return {due,fresh};
 // Avoid silently grouping edited or otherwise unrelated words.
 if(!scope.some(w=>w.id===ids[0]&&w.headword==='from (then) on')||!scope.some(w=>w.id===ids[1]&&w.headword==='from then on'))return {due,fresh};
 const candidates=[...due,...fresh].filter(w=>ids.includes(w.id));if(candidates.length<2)return {due,fresh};
 const history=db.prepare('SELECT word_id FROM learning_day_words WHERE word_id IN (?,?) AND day<? ORDER BY day DESC,position ASC LIMIT 2').all(ids[0],ids[1],shDay(now)) as {word_id:number}[];
 const dueGroup=due.filter(w=>ids.includes(w.id));let chosen:number;
 if(dueGroup.length===2){chosen=history.length?dueGroup.find(w=>w.id!==history[0].word_id)?.id??dueGroup[0].id:dueGroup[0].id;}
 else if(dueGroup.length===1){const d=dueGroup[0].id;chosen=history.length===2&&history.every(h=>h.word_id===d)?candidates.find(w=>w.id!==d)!.id:d;}
 else chosen=history.length?candidates.find(w=>w.id!==history[0].word_id)?.id??candidates[0].id:ids[1]!;
 // A fairness rotation from a due entry to its new sibling keeps the same due slot,
 // otherwise a fully booked review queue would prevent the sibling from ever entering.
 const promoted=dueGroup.length===1&&dueGroup[0].id!==chosen?fresh.find(w=>w.id===chosen):undefined;
 if(promoted)return {due:due.map(w=>w.id===dueGroup[0].id?promoted:w),fresh:fresh.filter(w=>!ids.includes(w.id))};
 return {due:due.filter(w=>!ids.includes(w.id)||w.id===chosen),fresh:fresh.filter(w=>!ids.includes(w.id)||w.id===chosen)};
}
