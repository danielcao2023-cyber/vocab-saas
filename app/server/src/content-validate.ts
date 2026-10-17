import { mainHeadwords, normalizeQuotes } from './text.ts';
export const KINDS=['example','collocation','distinction','synonym','antonym','pronunciation','mnemonic_etymology','mnemonic_association','related_words'] as const;
export type Kind=typeof KINDS[number];
export interface ValidBlock {kind:Kind;body:any;status:'generated'|'review';flags:string[];downgraded_from?:string}
export interface WordContext {headword:string;meaning_zh?:string|null;forms?: (string|{form:string;kind?:string})[];curriculum:{headword:string;order?:number;forms?:string[]}[]}
export const canonical=(s:string)=>normalizeQuotes(s).trim().toLowerCase();
export function inflections(word:string):string[] {
  const w=canonical(word);if(!/^[a-z]+$/.test(w))return [w];
  const y=/[^aeiou]y$/.test(w),e=w.endsWith('e'),double=/[^aeiou][aeiou][^aeiouwxy]$/.test(w);
  return [...new Set([w,w+'s',w+'es',y?w.slice(0,-1)+'ies':w+'s',w+'ed',e?w+'d':y?w.slice(0,-1)+'ied':w+'ed',e?w.slice(0,-1)+'ing':w+'ing',w+'ing',w+'er',w+'est',e?w+'r':w+'er',e?w+'st':w+'est',y?w.slice(0,-1)+'ier':w+'er',y?w.slice(0,-1)+'iest':w+'est',...(double?[w+w.at(-1)+'ed',w+w.at(-1)+'ing',w+w.at(-1)+'er',w+w.at(-1)+'est']:[])])];
}
export function targetForms(ctx:WordContext) {return new Set([...mainHeadwords(ctx.headword).flatMap(inflections),...(ctx.forms??[]).map(f=>canonical(typeof f==='string'?f:f.form))]);}
const unsafe=/(?:https?:|www\.|\b(?:audio|mp3|wav|http)\b|音频|播放|录音|<[^>]*>|\[[^\]]*\]\(|```|\*\*|(?:^|\s)[*_~][^\s].*?[*_~](?=\s|$)|^\s*[-*+]\s|^\s*#{1,6}\s|\p{Extended_Pictographic}|必考|中考必过|保证提分|[0-9一二三四五六七八九十百千万两]+\s*天搞定|你又错了|太差了|别人都会|(?:\d+\s*[%％]|百分之[一二三四五六七八九十百]+)\s*的同学|比别人强|别人都比你|只剩[^。！？]*还不努力)/imu;
function hasUnsafe(value:any):boolean {
  if(typeof value==='string')return unsafe.test(value);
  if(Array.isArray(value))return value.some(hasUnsafe);
  if(value&&typeof value==='object')return Object.entries(value).some(([key,v])=>unsafe.test(key)||hasUnsafe(v));
  return false;
}
const history=/来自|拉丁语|古英语|希腊语|源于|词源|词根是/;
const han=/\p{Script=Han}/u;
const english=/^[A-Za-z0-9\s.,!?;:'"()\-–—…/]+$/;
function ensure(v:unknown,msg:string): asserts v {if(!v)throw new Error(msg);}
function obj(x:any,keys:string[],required=keys) {ensure(x&&typeof x==='object'&&!Array.isArray(x),'object required');ensure(Object.keys(x).every(k=>keys.includes(k)),'unexpected field');ensure(required.every(k=>k in x),'missing field');}
function zh(x:any,max:number) {ensure(typeof x==='string'&&han.test(x)&&[...x].length<=max,'invalid Chinese text');}
function en(x:any,max=Infinity) {ensure(typeof x==='string'&&english.test(normalizeQuotes(x))&&x.length<=max,'invalid English text');}
function arr(x:any,max:number) {ensure(Array.isArray(x)&&x.length<=max,'invalid array length');}
function tokens(s:string) {return normalizeQuotes(s).match(/[A-Za-z]+(?:'[A-Za-z]+)?|\d+/g)??[];}
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function contains(text:string,form:string) {return new RegExp(`(^|[^a-z])${escape(canonical(form))}(?![a-z])`,'i').test(normalizeQuotes(text));}
export function validateContent(item:any,ctx:WordContext):{blocks:ValidBlock[];rejects:{kind:string;reason:string}[]} {
  const blocks:ValidBlock[]=[],rejects:{kind:string;reason:string}[]=[];
  const fields=['word','examples','collocations','distinctions','synonyms','antonyms','pronunciation','etymology','association','related_words'];
  try {obj(item,fields);ensure(typeof item.word==='string'&&canonical(item.word)===canonical(ctx.headword),'word mismatch');} catch(e) {return {blocks,rejects:[{kind:'item',reason:(e as Error).message}]};}
  const forms=targetForms(ctx),list=new Map<string,number>();const vocabulary=new Set<string>();
  for(const [i,w] of ctx.curriculum.entries())for(const h of mainHeadwords(w.headword)) {list.set(canonical(h),w.order??i);for(const f of [...inflections(h),...(w.forms??[])])vocabulary.add(canonical(f));}
  const inList=(w:string)=>list.has(canonical(w));
  function refs(xs:any[],noteKey:string,max:number,flags:string[],limitOutside=false) {
    arr(xs,max);const seen=new Set<string>();let outside=0;
    return xs.filter(x=>{obj(x,['word',noteKey,...(noteKey==='zh'&&'relation'in x?['relation']:[])]);en(x.word);zh(x[noteKey],noteKey==='note_zh'?20:40);const key=canonical(x.word);ensure(!forms.has(key)&&!seen.has(key),'self or duplicate word');seen.add(key);if(!inList(key)){if(limitOutside&&outside++>=1)return false;flags.push(`outside_list:${key}`);}return true;}).map(x=>({...x,in_list:inList(x.word)})).sort((a,b)=>(list.get(canonical(a.word))??Infinity)-(list.get(canonical(b.word))??Infinity));
  }
  function example(x:any,flags:string[],targetRequired=true) {
    obj(x,['en','zh','target'],targetRequired?['en','zh','target']:['en','zh']);en(x.en,120);zh(x.zh,40);const ts=tokens(x.en);ensure(ts.length>=6&&ts.length<=20,'example must contain 6–20 words');
    const matched=[...forms].filter(f=>contains(x.en,f));ensure(matched.length,'missing target');
    if(targetRequired||x.target!==undefined)ensure(typeof x.target==='string'&&forms.has(canonical(x.target))&&contains(x.en,x.target),'target mismatch');
    if(ts.filter(t=>!vocabulary.has(canonical(t))&&!/^[A-Z0-9]/.test(t)).length>1)flags.push('hard_word');
  }
  function add(field:string,kind:Kind,fn:(x:any,f:string[])=>any) {
    const x=item[field];if(x===null||Array.isArray(x)&&x.length===0)return;
    try {ensure(!hasUnsafe(x),'unsafe content');const flags:string[]=[];const body=fn(x,flags);blocks.push({kind,body,status:flags.length||kind==='mnemonic_etymology'?'review':'generated',flags:[...new Set(flags)]});}
    catch(e){rejects.push({kind,reason:(e as Error).message});}
  }
  add('examples','example',(xs,f)=>{arr(xs,2);ensure(xs.length===2,'example requires two sentences');for(const x of xs)example(x,f);ensure(canonical(xs[0].en).replace(/[^a-z0-9]/g,'')!==canonical(xs[1].en).replace(/[^a-z0-9]/g,''),'duplicate examples');return xs;});
  add('collocations','collocation',(xs)=>{arr(xs,3);ensure(xs.length>=2,'collocation requires two or three');const seen=new Set();for(const x of xs){obj(x,['en','zh']);en(x.en);zh(x.zh,16);ensure(tokens(x.en).length<=6&&[...forms].some(f=>contains(x.en,f)),'invalid collocation target/length');const key=canonical(x.en).replace(/[^a-z0-9]/g,'');ensure(!seen.has(key),'duplicate collocation');seen.add(key);}return xs;});
  add('distinctions','distinction',(xs,f)=>{arr(xs,2);for(const x of xs){obj(x,['words','explain_zh','example'],['words','explain_zh']);arr(x.words,3);ensure(x.words.length>=2&&x.words.some((w:any)=>typeof w==='string'&&forms.has(canonical(w))),'distinction target missing');ensure(new Set(x.words.map(canonical)).size===x.words.length,'duplicate distinction words');for(const w of x.words){en(w);if(!inList(w))f.push(`outside_list:${canonical(w)}`);}zh(x.explain_zh,120);if(x.example)example(x.example,f,false);}return xs;});
  const synonyms=Array.isArray(item.synonyms)?item.synonyms.map((x:any)=>canonical(String(x.word))):[];
  const antonyms=Array.isArray(item.antonyms)?item.antonyms.map((x:any)=>canonical(String(x.word))):[];
  const overlap=synonyms.some((w:string)=>antonyms.includes(w));
  for(const [field,kind] of [['synonyms','synonym'],['antonyms','antonym']] as const)add(field,kind,(xs,f)=>{ensure(!overlap,'word is both synonym and antonym');return refs(xs,'note_zh',3,f,true);});
  add('pronunciation','pronunciation',(x)=>{
    // Ignore model IPA, never expose a second transcription.
    const {ipa,phonetic,...p}=x;obj(p,['syllables','stress','points_zh','common_errors_zh']);
    ensure(mainHeadwords(ctx.headword).length===1&&/^[a-z]+$/i.test(mainHeadwords(ctx.headword)[0]),'phrase pronunciation unsupported');
    arr(p.syllables,20);ensure(p.syllables.length&&p.syllables.every((s:any)=>typeof s==='string'&&/^[a-z·-]+$/i.test(s)),'invalid syllables');ensure(canonical(p.syllables.join('').replace(/[·-]/g,''))===canonical(mainHeadwords(ctx.headword)[0]),'syllables mismatch');ensure(Number.isInteger(p.stress)&&p.stress>=0&&p.stress<p.syllables.length,'invalid stress');for(const key of ['points_zh','common_errors_zh']){arr(p[key],3);p[key].forEach((v:any)=>zh(v,40));}return p;
  });
  add('etymology','mnemonic_etymology',(x,f)=>{
    obj(x,['confidence','chain','parts','explain_zh','same_root'],['chain','parts','explain_zh','same_root']);ensure(x.confidence===undefined||['high','medium','low'].includes(x.confidence),'invalid confidence');en(x.chain.replace(/[→]/g,' '));zh(x.explain_zh,80);arr(x.parts,10);let at=0,matched=x.parts.length>0;const head=canonical(mainHeadwords(ctx.headword)[0]??'');
    for(const p of x.parts){obj(p,['form','meaning_zh','origin']);en(p.form);en(p.origin);zh(p.meaning_zh,40);const part=canonical(p.form.replace(/-/g,''));const next=head.indexOf(part,at);if(!part||next<0)matched=false;else at=next+part.length;}
    const same_root=refs(x.same_root,'zh',4,f);if(x.confidence!=='high'||!matched){
      // Rebuild from parts as a memory cue; discard all historical assertions.
      const cue=x.parts.map((p:any)=>`${p.form}（${p.meaning_zh}）`).join(' + ');const text_zh=`可以这样记：${cue||mainHeadwords(ctx.headword)[0]}`;zh(text_zh,80);ensure(!history.test(text_zh),'unsafe downgraded association');f.push('etymology_downgraded');return {__downgrade:true,text_zh};
    }return {...x,same_root};
  });
  add('association','mnemonic_association',(x)=>{obj(x,['text_zh']);zh(x.text_zh,80);ensure(!history.test(x.text_zh),'association claims historical origin');return x;});
  add('related_words','related_words',(xs,f)=>{arr(xs,4);for(const x of xs)ensure(['derivative','compound','same_root'].includes(x.relation),'invalid relation');return refs(xs,'zh',4,f);});
  const down=blocks.find(b=>b.kind==='mnemonic_etymology'&&b.body.__downgrade);
  if(down){const own=blocks.find(b=>b.kind==='mnemonic_association');if(own){own.body={text_zh:`${down.body.text_zh}；${own.body.text_zh}`.slice(0,80)};own.flags.push(...down.flags);own.status='review';own.downgraded_from='mnemonic_etymology';blocks.splice(blocks.indexOf(down),1);}else{down.kind='mnemonic_association';down.body={text_zh:down.body.text_zh};down.downgraded_from='mnemonic_etymology';}}
  return {blocks,rejects};
}
export function validateZk(item:any,word:string) {
  obj(item,['word','score','basis_zh']);ensure(typeof item.word==='string'&&canonical(item.word)===canonical(word),'word mismatch');ensure(Number.isInteger(item.score)&&item.score>=1&&item.score<=5,'score must be integer 1–5');zh(item.basis_zh,40);ensure(!unsafe.test(item.basis_zh)&&!/[\p{N}%％]|统计|真题出现|次/u.test(item.basis_zh),'basis cannot claim statistics');return item as {word:string;score:number;basis_zh:string};
}
