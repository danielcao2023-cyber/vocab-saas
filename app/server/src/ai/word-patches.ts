import type { DB } from '../db.ts';
type WordPatch={entry:string;field:'meaning_zh'|'phonetic';expected:string|null;value:string;source:string;reason?:string};
/** Explicit old-value checks, restricted columns, and dry-run by default. Raw data and learning tables are untouched. */
export function applyWordPatches(db:DB,input:any,yes=false){
  if(input?.format!=='vocab-word-patches'||input.version!==1||!Array.isArray(input.patches))throw new Error('invalid word patches');
  const seen=new Set<string>();
  const plan=input.patches.map((patch:WordPatch)=>{
    if(!patch||typeof patch.entry!=='string'||!['meaning_zh','phonetic'].includes(patch.field)||!(patch.expected===null||typeof patch.expected==='string')||typeof patch.value!=='string'||!patch.value.trim()||typeof patch.source!=='string'||!patch.source.trim())throw new Error('invalid word patch');
    const key=patch.entry+'/'+patch.field;if(seen.has(key))throw new Error('duplicate word patch');seen.add(key);
    const row=db.prepare("SELECT id,meaning_zh,phonetic FROM words WHERE source='kb2022' AND headword=?").get(patch.entry) as {id:number;meaning_zh:string|null;phonetic:string|null}|undefined;
    if(!row)throw new Error('unknown word: '+patch.entry);
    const before=row[patch.field],unchanged=before===patch.value;
    if(!unchanged&&before!==patch.expected)throw new Error('stale word patch: '+patch.entry+'/'+patch.field);
    return {...patch,id:row.id,before,unchanged};
  });
  let written=0;if(yes)db.transaction(()=>{for(const patch of plan){if(patch.unchanged)continue;
    written+=patch.field==='meaning_zh'?db.prepare("UPDATE words SET meaning_zh=?,meaning_source='manual',meaning_flag=NULL WHERE id=?").run(patch.value,patch.id).changes:db.prepare('UPDATE words SET phonetic=? WHERE id=?').run(patch.value,patch.id).changes;
  }})();return {planned:plan.filter((p:any)=>!p.unchanged).length,unchanged:plan.filter((p:any)=>p.unchanged).length,written,plan};
}
