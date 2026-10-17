import type { DB } from './db.ts';
import { KINDS, canonical, type Kind } from './content-validate.ts';
import { mainHeadwords } from './text.ts';
export const LABELS:Record<Kind,string>={example:'例句',collocation:'常见搭配',distinction:'易混词',synonym:'近义',antonym:'反义',pronunciation:'发音',mnemonic_etymology:'词源',mnemonic_association:'联想 · 帮助记忆，不是词源',related_words:'相关词'};
export function getContent(db:DB,wordId:number) {
  const pending={status:'pending' as const,blocks:[]};
  try {
    // 每种内容只看最新一条已批准的版本（含已隐藏的）：旧版本一旦被取代就再也不显示；最新的被隐藏时这一块不显示。
    const rows=db.prepare("SELECT * FROM word_content WHERE word_id=? AND status='approved' ORDER BY id DESC").all(wordId) as any[];
    const refs=new Map<string,{inList:boolean;learned:boolean}>();
    const words=db.prepare("SELECT w.headword,w.source,c.state FROM words w LEFT JOIN cards c ON c.word_id=w.id AND c.mode='recognize'").all() as {headword:string;source:string;state:number|null}[];
    for(const w of words)if(w.source==='kb2022')for(const h of mainHeadwords(w.headword))refs.set(canonical(h),{inList:true,learned:w.state!==null&&w.state!==0});
    const annotate=(xs:any[])=>xs.map(x=>({...x,...(refs.get(canonical(x.word))??{inList:false,learned:false})})).sort((a,b)=>Number(b.inList)-Number(a.inList)||Number(b.learned)-Number(a.learned));
    const blocks=KINDS.flatMap(kind=>{const r=rows.find(r=>r.kind===kind);if(!r||r.hidden_at)return [];let body=JSON.parse(r.body_json);const flags=JSON.parse(r.flags_json??'[]');if(!Array.isArray(flags)||!body||Array.isArray(body)&&!body.length) return [];
      if(['synonym','antonym','related_words'].includes(kind))body=annotate(body);
      if(kind==='mnemonic_etymology')body={...body,same_root:annotate(body.same_root??[])};
      return [{id:r.id,kind,body,flags,label:LABELS[kind]}];});
    return blocks.length?{status:'ready' as const,blocks}:pending;
  }catch{return pending;}
}
export const FEEDBACK_REASONS=['例句不通','意思不对','太难','其他'] as const;
export function contentFeedback(db:DB,id:number,reason:string,now=new Date()) {
  if(!FEEDBACK_REASONS.includes(reason as any))throw new Error('invalid feedback reason');
  return db.transaction(()=>{
    const r=db.prepare('SELECT * FROM word_content WHERE id=?').get(id) as any;
    if(!r)throw new Error('content not found');if(r.hidden_at)return {ok:true};
    db.prepare('INSERT INTO content_feedback(word_id,content_id,kind,content_version,reason) VALUES (?,?,?,?,?)').run(r.word_id,id,r.kind,`${r.model}/${r.prompt_version}`,reason);
    db.prepare('UPDATE word_content SET hidden_at=?,hidden_reason=? WHERE id=?').run(now.toISOString(),`feedback:${reason}`,id);return {ok:true};
  })();
}
