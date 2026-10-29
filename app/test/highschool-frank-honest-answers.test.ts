import {expect,it} from 'vitest';
import {createSSRApp,h} from 'vue';
import {renderToString} from '@vue/server-renderer';
import MeaningList from '../web/src/MeaningList.vue';
import {acceptedAnswers} from '../server/src/study';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
const now=new Date('2026-10-21T01:00:00Z');
const terms=[['to be frank','to be honest'],['to be honest','to be frank']] as const;
const current='phr. 坦白说；说实话';
it('the card meaning renderer shows the frank/honest sense and hides extra imported lines',async()=>{
 expect(await renderToString(createSSRApp({render:()=>h(MeaningList,{meaning:current})}))).toContain('说实话');
 const hidden=await renderToString(createSSRApp({render:()=>h(MeaningList,{meaning:'n. 撒谎\nn. 辩论\nn. 说实话',source:'词库导入'})}));
 expect(hidden).not.toContain('说实话');
});
it.each(terms)('%s accepts %s only for a visible exact frank/honest sense', (a,b)=>{
 expect(acceptedAnswers(a,'spell',current)).toEqual([a,b]);
 expect(acceptedAnswers(a,'spell','n. 撒谎')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 不是说实话')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 撒谎\nn. 辩论\nn. 说实话')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 撒谎\nn. 辩论\nn. 说实话','manual')).toEqual([a,b]);
 expect(acceptedAnswers(a,'dictation',current)).toEqual([a]);
});
for(const v3 of [false,true])for(const offline of [false,true])for(const [main,other] of terms)for(const mode of ['spell','dictation'] as const)it(`${v3?'V3':'V2'} ${offline?'offline':'online'} restored ${main} ${mode}`,async()=>{
 const source=v3?makeV3Fixture(2):makeLegacyFixture(2);const actualMeaning=(word:string)=>word==='to be frank'?'phr. 坦白说；说实话':'老实说；说实话；说实在的';
 source.prepare('UPDATE words SET headword=?,meaning_zh=?,meaning_source=? WHERE id=1').run(main,actualMeaning(main),'词库导入');source.prepare('UPDATE words SET headword=?,meaning_zh=? WHERE id=2').run(other,actualMeaning(other));
 startLearning(source,now);source.prepare('UPDATE learning_day_words SET position=CASE WHEN word_id=1 THEN 0 ELSE 1 END').run();const issue=nextLearning(source,now).card!;source.prepare('UPDATE learning_issues SET mode=? WHERE id=?').run(mode,issue.issueId);
 const mobile=offline?await openBrowserDatabase(source.serialize()):null,db=mobile?asSharedDb(mobile):source;if(mobile)source.close();try{
  const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issue.issueId);expect(card.wordId).toBe(1);expect(card.patterns).toEqual((mode==='spell'?[main,other]:[main]).map(s=>s.replace(/[a-z]/g,'_')));
  if(mode==='dictation')expect(card.audioWord).toBe(main);const otherState=db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all();const input={policyVersion:3 as const,issueId:issue.issueId,answerId:'to be frank-answer',answer:other};const result=answerLearning(db,input,now);
  expect(result.correct).toBe(mode==='spell');expect(answerLearning(db,input,now)).toEqual(result);expect(db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all()).toEqual(otherState);
 }finally{mobile?mobile.close():source.close()}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} restores an open card after a user changes the meaning`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{
  db.prepare("UPDATE words SET headword='to be frank',meaning_zh='n. 说实话',meaning_source='manual' WHERE id=1").run();startLearning(db,now);const issued=nextLearning(db,now).card!;db.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(issued.issueId);
  expect(nextLearning(db,now).card?.patterns).toEqual(terms[0].map(s=>s.replace(/[a-z]/g,'_')));
  db.prepare("UPDATE words SET meaning_zh='n. 撒谎' WHERE id=1").run();
  const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issued.issueId);expect(card.meaning).toBe('n. 撒谎');expect(card.patterns).toEqual([terms[0][0].replace(/[a-z]/g,'_')]);
  expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'changed-meaning',answer:'to be honest'},now).correct).toBe(false);
 }finally{db.close()}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} replays pre-upgrade results unchanged`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{db.prepare("UPDATE words SET headword='to be frank',meaning_zh='n. 说实话' WHERE id=1").run();startLearning(db,now);const card=nextLearning(db,now).card!;const result={correct:false,expected:'to be frank',historical:true};
  db.prepare('UPDATE learning_issues SET answered_at=?,answer_id=?,result_json=? WHERE id=?').run(now.toISOString(),'old',JSON.stringify(result),card.issueId);
  expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'old',answer:'to be honest'},now)).toEqual(result);
 }finally{db.close()}
});
