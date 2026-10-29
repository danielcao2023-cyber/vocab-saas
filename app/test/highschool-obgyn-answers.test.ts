import {expect,it} from 'vitest';
import {createSSRApp,h} from 'vue';
import {renderToString} from '@vue/server-renderer';
import MeaningList from '../web/src/MeaningList.vue';
import {acceptedAnswers} from '../server/src/study';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
const now=new Date('2026-10-21T01:00:00Z');
const terms=[['the ob-gyn department','department of obstetrics and gynecology'],['department of obstetrics and gynecology','the ob-gyn department']] as const;
const current='n. 妇产科';
it('the card meaning renderer shows the obstetrics and gynecology department sense and hides extra imported lines',async()=>{
 expect(await renderToString(createSSRApp({render:()=>h(MeaningList,{meaning:current})}))).toContain('妇产科');
 const hidden=await renderToString(createSSRApp({render:()=>h(MeaningList,{meaning:'n. 儿科\nn. 内科\nn. 妇产科',source:'词库导入'})}));
 expect(hidden).not.toContain('妇产科');
});
it.each(terms)('%s accepts %s only for a visible exact obstetrics and gynecology department sense', (a,b)=>{
 expect(acceptedAnswers(a,'spell',current)).toEqual([a,b]);
 expect(acceptedAnswers(a,'spell','n. 儿科')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 不是妇产科')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 妇产科门诊')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 妇产科；儿科')).toEqual([a,b]);
 expect(acceptedAnswers(a,'spell','n. 儿科\nn. 内科\nn. 妇产科')).toEqual([a]);
 expect(acceptedAnswers(a,'spell','n. 儿科\nn. 内科\nn. 妇产科','manual')).toEqual([a,b]);
 expect(acceptedAnswers(a,'dictation',current)).toEqual([a]);
});
for(const v3 of [false,true])for(const offline of [false,true])for(const [main,other] of terms)for(const mode of ['spell','dictation'] as const)it(`${v3?'V3':'V2'} ${offline?'offline':'online'} restored ${main} ${mode}`,async()=>{
 const source=v3?makeV3Fixture(2):makeLegacyFixture(2);const actualMeaning=(word:string)=>word==='the ob-gyn department'?'n. 妇产科':'n. 妇产科';
 source.prepare('UPDATE words SET headword=?,meaning_zh=?,meaning_source=? WHERE id=1').run(main,actualMeaning(main),'词库导入');source.prepare('UPDATE words SET headword=?,meaning_zh=? WHERE id=2').run(other,actualMeaning(other));
 startLearning(source,now);source.prepare('UPDATE learning_day_words SET position=CASE WHEN word_id=1 THEN 0 ELSE 1 END').run();const issue=nextLearning(source,now).card!;source.prepare('UPDATE learning_issues SET mode=? WHERE id=?').run(mode,issue.issueId);
 const mobile=offline?await openBrowserDatabase(source.serialize()):null,db=mobile?asSharedDb(mobile):source;if(mobile)source.close();try{
  const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issue.issueId);expect(card.wordId).toBe(1);expect(card.patterns).toEqual((mode==='spell'?[main,other]:[main]).map(s=>s.replace(/[a-z]/g,'_')));
  if(mode==='dictation')expect(card.audioWord).toBe(main);const otherState=db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all();const input={policyVersion:3 as const,issueId:issue.issueId,answerId:'the ob-gyn department-answer',answer:other};const result=answerLearning(db,input,now);
  expect(result.correct).toBe(mode==='spell');expect(answerLearning(db,input,now)).toEqual(result);expect(db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all()).toEqual(otherState);
 }finally{mobile?mobile.close():source.close()}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} restores an open card after a user changes the meaning`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{
  db.prepare("UPDATE words SET headword='the ob-gyn department',meaning_zh='n. 妇产科',meaning_source='manual' WHERE id=1").run();startLearning(db,now);const issued=nextLearning(db,now).card!;db.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(issued.issueId);
  expect(nextLearning(db,now).card?.patterns).toEqual(terms[0].map(s=>s.replace(/[a-z]/g,'_')));
  db.prepare("UPDATE words SET meaning_zh='n. 儿科' WHERE id=1").run();
  const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issued.issueId);expect(card.meaning).toBe('n. 儿科');expect(card.patterns).toEqual(['___ __-___ __________']);
  expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'changed-meaning',answer:'department of obstetrics and gynecology'},now).correct).toBe(false);
 }finally{db.close()}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} replays pre-upgrade results unchanged`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{db.prepare("UPDATE words SET headword='the ob-gyn department',meaning_zh='n. 妇产科' WHERE id=1").run();startLearning(db,now);const card=nextLearning(db,now).card!;const result={correct:false,expected:'the ob-gyn department',historical:true};
  db.prepare('UPDATE learning_issues SET answered_at=?,answer_id=?,result_json=? WHERE id=?').run(now.toISOString(),'old',JSON.stringify(result),card.issueId);
  expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'old',answer:'department of obstetrics and gynecology'},now)).toEqual(result);
 }finally{db.close()}
});

it('case is normalized but the textbook hyphen is required',()=>{
 expect(acceptedAnswers('the OB-GYN department','spell','n. 妇产科')).toEqual(terms[0]);
 expect(acceptedAnswers('the OB-GYN department','spell','n. 妇产科')).not.toContain('the ob gyn department');
});
