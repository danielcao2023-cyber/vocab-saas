import type { DB } from '../db.ts';
import {mainHeadwords,normalizeQuotes} from '../text.ts';
import { irregular } from './data/irregular-forms.ts';
export function validationForms(headword:string) {
  const forms=mainHeadwords(headword).flatMap(h=>(irregular[h.toLowerCase()]??'').split(',').filter(Boolean));
  // Explicit curriculum alternatives are lexical forms, not guessed derivations.
  if(headword==='until (till)')forms.push('till');
  return forms.map(form=>({form,kind:'validation'}));
}
/** Only explicit curriculum annotations, never guessed irregular forms. */
export function curriculumForms(headword:string) {
  const forms:{form:string;kind:string}[]=[],head=mainHeadwords(headword)[0]?.toLowerCase();
  for(const [,western,eastern] of normalizeQuotes(headword).matchAll(/\(([^)]*)\)|（([^）]*)）/g)){
    const note=(western??eastern??'').trim();
    const plural=note.match(/^pl\.\s+(.+)$/),american=note.match(/^Am\s?E\s+(.+)$/);
    const values=plural?.[1]??american?.[1]??(head==='be'&&note==='am, is, are'||head==='have'&&note==='has'?note:null);
    if(values)for(const value of values.split(/\s*[,/]\s*/)){const form=value.trim().toLowerCase();if(/^[a-z][a-z.' -]*$/.test(form))forms.push({form,kind:plural?'s':american?'spelling':['is','has'].includes(form)?'3':'form'});}
  }
  return forms;
}
export function importCurriculumForms(db:DB) {
  let changes=0;const words=db.prepare("SELECT id,headword FROM words WHERE source='kb2022'").all() as {id:number;headword:string}[];
  db.transaction(()=>{const insert=db.prepare('INSERT OR IGNORE INTO word_forms(word_id,form,kind) VALUES (?,?,?)');for(const word of words)for(const f of curriculumForms(word.headword))changes+=insert.run(word.id,f.form,f.kind).changes;})();return {changes};
}
