// 模拟模型：确定性、离线、不启动任何进程。ai-generate 默认使用它；真实模型只在显式 --real 时启用。
// 输出全部带「【模拟】」标记，记录为 model=fake-model、prompt_version 加 -fake 后缀，不能当作真实内容导出。
import { createHash } from 'node:crypto';
import { mainHeadwords } from '../text.ts';
import type { Runner } from './codex-runner.ts';
export const FAKE_MODEL='fake-model',FAKE_SUFFIX='-fake',FAKE_MARK='【模拟】';
const n=(s:string)=>createHash('sha256').update(s).digest().readUInt32BE(0);
function section(prompt:string,start:string,end:string) {const a=prompt.split(start)[1];if(a===undefined)throw new Error('fake runner: prompt section missing');return JSON.parse(a.split(end)[0]);}
function contentItem(w:{headword:string},curriculum:{headword:string}[]) {
  const head=mainHeadwords(w.headword)[0]??w.headword,single=/^[a-z]+$/i.test(head);
  const pool=curriculum.map(c=>mainHeadwords(c.headword)[0]).filter((h):h is string=>!!h&&/^[a-z]+$/i.test(h)&&h.toLowerCase()!==head.toLowerCase());
  const synonym=pool.length?pool[n(w.headword)%pool.length]:null;
  return {word:w.headword,
    examples:[{en:`We read the word ${head} in class today.`,zh:`${FAKE_MARK}我们今天在课上读到了这个词。`,target:head},{en:`My friend can use ${head} in a short sentence.`,zh:`${FAKE_MARK}我的朋友能用它造一个短句。`,target:head}],
    collocations:[{en:`use ${head}`,zh:`${FAKE_MARK}搭配一`},{en:`${head} well`,zh:`${FAKE_MARK}搭配二`}],
    distinctions:[],synonyms:synonym?[{word:synonym,note_zh:`${FAKE_MARK}近义示例`}]:[],antonyms:[],
    pronunciation:single?{syllables:[head],stress:0,points_zh:[`${FAKE_MARK}发音要点`],common_errors_zh:[]}:null,
    etymology:null,association:{text_zh:`${FAKE_MARK}想象这个词出现在课堂上的画面。`},related_words:[]};
}
export const fakeRunner:Runner=async req=>{
  const started=Date.now(),words=section(req.prompt,'本批：','\n课标') as {headword:string}[];
  const items=req.prompt.includes('score 为一到五整数')
    ?words.map(w=>({word:w.headword,score:1+n(w.headword)%5,basis_zh:`${FAKE_MARK}测试用打分，不是真实评估`}))
    :words.map(w=>contentItem(w,section(req.prompt,'课标词表与出词顺序：','\n上次校验错误')));
  return {stdout:JSON.stringify({items}),exitCode:0,durationMs:Date.now()-started};
};
