import {expect,it} from 'vitest';
import {createSSRApp,h} from 'vue';
import {renderToString} from '@vue/server-renderer';
import MeaningList from '../web/src/MeaningList.vue';
import {acceptedAnswers} from '../server/src/study';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
const now=new Date('2026-10-21T01:00:00Z');
const words=['lead to','result in','bring about'] as const;
const terms=words.flatMap(a=>words.filter(b=>a!==b).map(b=>[a,b] as const));
const causalAnswers=(a:string)=>[a,...words.filter(w=>w!==a)];
const current='短语 导致；造成；通向';
it('the card meaning renderer shows the causal sense and hides extra imported lines',async()=>{
 expect(await renderToString(createSSRApp({render:()=>h(MeaningList,{meaning:current})}))).toContain('造成');
 const hidden=await renderToString(createSSRApp({render:()=>h(MeaningList,{meaning:'n. 通向\nn. 带领\nn. 造成',source:'词库导入'})}));
 expect(hidden).not.toContain('造成');
});
it.each(terms)('%s accepts %s only for a visible exact causal sense', (a,b)=>{
 expect(acceptedAnswers(a,'spell',current)).toEqual(causalAnswers(a));
 expect(acceptedAnswers(a,'spell','n. 通向')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 不是造成')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 通向\nn. 带领\nn. 造成')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 通向\nn. 带领\nn. 造成','manual')).toEqual(causalAnswers(a));
 expect(acceptedAnswers(a,'dictation',current)).toEqual([a]);
});
for(const v3 of [false,true])for(const offline of [false,true])for(const [main,other] of terms)for(const mode of ['spell','dictation'] as const)it(`${v3?'V3':'V2'} ${offline?'offline':'online'} restored ${main} ${mode}`,async()=>{
 const source=v3?makeV3Fixture(2):makeLegacyFixture(2);const actualMeaning=(word:string)=>word==='lead to'?'短语 导致；造成；通向':word==='result in'?'phr. v. 导致；造成':'na. 造成；带来；【航】(使船)回转';
 source.prepare('UPDATE words SET headword=?,meaning_zh=?,meaning_source=? WHERE id=1').run(main,actualMeaning(main),'词库导入');source.prepare('UPDATE words SET headword=?,meaning_zh=? WHERE id=2').run(other,actualMeaning(other));
 startLearning(source,now);source.prepare('UPDATE learning_day_words SET position=CASE WHEN word_id=1 THEN 0 ELSE 1 END').run();const issue=nextLearning(source,now).card!;source.prepare('UPDATE learning_issues SET mode=? WHERE id=?').run(mode,issue.issueId);
 const mobile=offline?await openBrowserDatabase(source.serialize()):null,db=mobile?asSharedDb(mobile):source;if(mobile)source.close();try{
  const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issue.issueId);expect(card.wordId).toBe(1);expect(card.patterns).toEqual((mode==='spell'?causalAnswers(main):[main]).map(s=>s.replace(/[a-z]/g,'_')));
  if(mode==='dictation')expect(card.audioWord).toBe(main);const otherState=db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all();const input={policyVersion:3 as const,issueId:issue.issueId,answerId:'lead to-answer',answer:other};const result=answerLearning(db,input,now);
  expect(result.correct).toBe(mode==='spell');expect(answerLearning(db,input,now)).toEqual(result);expect(db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all()).toEqual(otherState);
 }finally{mobile?mobile.close():source.close()}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} restores an open card after a user changes the meaning`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{
  db.prepare("UPDATE words SET headword='lead to',meaning_zh='n. 造成',meaning_source='manual' WHERE id=1").run();startLearning(db,now);const issued=nextLearning(db,now).card!;db.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(issued.issueId);
  expect(nextLearning(db,now).card?.patterns).toEqual(causalAnswers('lead to').map(s=>s.replace(/[a-z]/g,'_')));
  db.prepare("UPDATE words SET meaning_zh='n. 通向' WHERE id=1").run();
  const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issued.issueId);expect(card.meaning).toBe('n. 通向');expect(card.patterns).toEqual([terms[0][0].replace(/[a-z]/g,'_')]);
  expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'changed-meaning',answer:'result in'},now).correct).toBe(false);
 }finally{db.close()}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} replays pre-upgrade results unchanged`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{db.prepare("UPDATE words SET headword='lead to',meaning_zh='n. 造成' WHERE id=1").run();startLearning(db,now);const card=nextLearning(db,now).card!;const result={correct:false,expected:'lead to',historical:true};
  db.prepare('UPDATE learning_issues SET answered_at=?,answer_id=?,result_json=? WHERE id=?').run(now.toISOString(),'old',JSON.stringify(result),card.issueId);
  expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'old',answer:'result in'},now)).toEqual(result);
 }finally{db.close()}
});
it.each(terms)('%s requires a visible whole causal sense', (a,b)=>{
 for(const meaning of ['短语 导致','phr. v. 导致','短语 造成','phr. v. 造成','导致','造成'])expect(acceptedAnswers(a,'spell',meaning)).toEqual(causalAnswers(a));
 for(const meaning of ['短语 不导致','短语 通向','n. 不造成','n. 非导致','n. 通向\nn. 带领\nn. 导致'])expect(acceptedAnswers(a,'spell',meaning)).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 通向\nn. 带领\nn. 导致','manual')).toEqual(causalAnswers(a));
});
