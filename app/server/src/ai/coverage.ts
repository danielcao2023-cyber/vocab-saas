import type { DB } from '../db.ts';

interface ContentRow {id:number;word_id:number;kind:string;model:string|null;prompt_version:string|null;body_json:string;status:string;hidden_at:string|null;reviewed:number}
export function latestVersions<T extends {id:number;word_id:number;kind:string}>(rows:T[]) {
  const latest=new Map<string,T>();for(const row of rows){const key=`${row.word_id}/${row.kind}`;if(!latest.has(key)||latest.get(key)!.id<row.id)latest.set(key,row);}return [...latest.values()];
}
function hasBody(row:Pick<ContentRow,'body_json'>) {try{const body=JSON.parse(row.body_json);return !!body&&typeof body==='object'&&(!Array.isArray(body)||body.length>0);}catch{return false;}}
export function isRealContent(row:Pick<ContentRow,'model'|'prompt_version'|'body_json'>) {
  return !!row.model&&row.model!=='fake-model'&&!row.prompt_version?.endsWith('-fake')&&!row.body_json.includes('【模拟】');
}
/** Read-only audit; generated, actually reviewed and child-visible coverage are separate. */
export function contentCoverage(db:DB) {
  const words=db.prepare("SELECT id,headword,meaning_zh,meaning_source,phonetic FROM words WHERE source='kb2022' ORDER BY id").all() as {id:number;headword:string;meaning_zh:string|null;meaning_source:string|null;phonetic:string|null}[];
  const rows=db.prepare("SELECT id,word_id,kind,model,prompt_version,body_json,status,hidden_at,reviewed FROM word_content WHERE word_id IN (SELECT id FROM words WHERE source='kb2022')").all() as ContentRow[];
  const byWord=new Map<number,ContentRow[]>();for(const row of rows){if(!byWord.has(row.word_id))byWord.set(row.word_id,[]);byWord.get(row.word_id)!.push(row);}
  const entries=words.map(w=>{
    const all=byWord.get(w.id)??[],active=latestVersions(all).filter(r=>isRealContent(r)&&!r.hidden_at&&hasBody(r));
    const kinds=(rs:ContentRow[])=>[...new Set(rs.map(r=>r.kind))];
    // getContent selects the latest approved version before checking hidden_at.
    const approved=latestVersions(all.filter(r=>r.status==='approved')).filter(r=>isRealContent(r)&&!r.hidden_at&&hasBody(r));
    const generatedKinds=kinds(active),approvedKinds=kinds(approved),reviewedKinds=kinds(active.filter(r=>r.reviewed===1));
    return {wordId:w.id,headword:w.headword,hasMeaning:!!w.meaning_zh?.trim(),meaningSource:w.meaning_source,hasPhonetic:!!w.phonetic?.trim(),generatedKinds,approvedKinds,reviewedKinds,coreGenerated:['example','collocation'].every(k=>generatedKinds.includes(k)),coreApproved:['example','collocation'].every(k=>approvedKinds.includes(k)),fakeBlocks:all.filter(r=>r.model==='fake-model'||r.prompt_version?.endsWith('-fake')||r.body_json.includes('【模拟】')).length,unknownModelBlocks:all.filter(r=>!r.model).length};
  });
  const real=rows.filter(isRealContent),active=latestVersions(rows).filter(r=>isRealContent(r)&&!r.hidden_at&&hasBody(r));
  const counts=(rs:ContentRow[],key:'status'|'kind')=>Object.fromEntries([...new Set(rs.map(r=>r[key]))].sort().map(value=>[value,rs.filter(r=>r[key]===value).length]));
  return {totalWords:words.length,basic:{withMeaning:entries.filter(r=>r.hasMeaning).length,withPhonetic:entries.filter(r=>r.hasPhonetic).length,manualMeanings:entries.filter(r=>r.meaningSource==='manual').length},real:{words:entries.filter(r=>r.generatedKinds.length).length,coreGenerated:entries.filter(r=>r.coreGenerated).length,coreApproved:entries.filter(r=>r.coreApproved).length,blocks:real.length,activeBlocks:active.length,states:counts(active,'status'),kinds:counts(active,'kind')},fakeBlocks:entries.reduce((n,r)=>n+r.fakeBlocks,0),unknownModelBlocks:entries.reduce((n,r)=>n+r.unknownModelBlocks,0),missingCore:entries.filter(r=>!r.coreGenerated).map(r=>r.headword),entries};
}
