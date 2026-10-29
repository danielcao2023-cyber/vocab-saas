import {describe,expect,it} from 'vitest';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {acceptedSpellings,acceptedAnswers,checkSpelling} from '../server/src/study';
import {meaningsOverlap} from '../server/src/quiz';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
const now=new Date('2026-10-21T01:00:00Z');
const pairs=[['tofu','bean curd'],['bean curd','tofu'],['estate agent','real estate agent'],['real estate agent','estate agent'],['leapt','leaped'],['leaped','leapt'],['despite','in spite of'],['in spite of','despite']] as const;
describe('precise meaning equivalents',()=>{
 it.each(pairs)('%s accepts %s only on translation', (main,other)=>{
  expect(acceptedAnswers(main,'spell')).toEqual([main,other]);
  expect(acceptedAnswers(main,'dictation')).toEqual([main]);
  expect(acceptedSpellings(main)).toEqual([main]);
 });
 it('does not infer arbitrary synonyms',()=>expect(acceptedAnswers('soybean','spell')).toEqual(['soybean']));
});
for(const v3 of [false,true])for(const offline of [false,true])for(const mode of ['spell','dictation'] as const)it.each(pairs)(`${v3?'V3':'V2'} ${offline?'offline':'online'} ${mode} old %s accepts equivalent %s only when appropriate and replays`,async(main,other)=>{
 const source=v3?makeV3Fixture(2):makeLegacyFixture(2);
 const meaning=(main==='despite'||main==='in spite of')?'prep. 尽管；不顾':main.includes('agent')?'n. 房地产经纪人':main.startsWith('leap')?'v. 跳跃（leap 的过去式或过去分词）':'n. 豆腐';
 const prompt=(word:string)=>word==='despite'?'prep. 尽管，不管\nn. 轻视；憎恨；侮辱':word==='in spite of'?'prep. phr. 尽管；不顾':meaning;
 source.prepare('UPDATE words SET headword=?,meaning_zh=? WHERE id=1').run(main,prompt(main));source.prepare('UPDATE words SET headword=?,meaning_zh=? WHERE id=2').run(other,prompt(other));
 startLearning(source,now);source.prepare('UPDATE learning_day_words SET position=CASE WHEN word_id=1 THEN 0 ELSE 1 END').run();const issued=nextLearning(source,now).card!;source.prepare('UPDATE learning_issues SET mode=? WHERE id=?').run(mode,issued.issueId);
 const mobile=offline?await openBrowserDatabase(source.serialize()):null,db=mobile?asSharedDb(mobile):source;if(mobile)source.close();
 try{const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issued.issueId);expect(card.wordId).toBe(1);expect(card.mode).toBe(mode);
  expect(card.patterns).toEqual(mode==='spell'?[main,other].map(s=>s.replace(/[a-z]/g,'_')):[main.replace(/[a-z]/g,'_')]);
  if(mode==='dictation')expect(card.audioWord).toBe(main);
  const otherState=db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all();
  const input={policyVersion:3 as const,issueId:card.issueId,answerId:`tofu-${mode}`,answer:other.toUpperCase()};const result=answerLearning(db,input,now);
  expect(result.correct).toBe(mode==='spell');expect(result.expected).toBe(main);expect(answerLearning(db,input,now)).toEqual(result);
  expect(db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all()).toEqual(otherState);
  expect(db.prepare('SELECT id,headword FROM words ORDER BY id').all()).toEqual([{id:1,headword:main},{id:2,headword:other}]);
 }finally{mobile?mobile.close():source.close()}
});
it.each(pairs)('legacy spell check %s accepts %s',(main,other)=>{const db=makeLegacyFixture();try{db.prepare('UPDATE words SET headword=? WHERE id=1').run(main);startLearning(db,now);const card=db.prepare("SELECT id FROM cards WHERE word_id=1 AND mode='spell'").get() as {id:number};expect(checkSpelling(db,card.id,other,now).correct).toBe(true)}finally{db.close()}});
it('recognition distractor overlap detects the real catalog definitions',()=>{expect(meaningsOverlap('n. 豆腐','na. 豆腐')).toBe(true)});
for(const v3 of [false,true])it(`policy ${v3?3:2} replays old answered result without recomputing`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{
  db.prepare("UPDATE words SET headword='tofu' WHERE id=1").run();startLearning(db,now);const card=nextLearning(db,now).card!;
  const historical={correct:false,expected:'tofu',historical:true};
  db.prepare('UPDATE learning_issues SET answered_at=?,answer_id=?,result_json=? WHERE id=?').run(now.toISOString(),'old-answer',JSON.stringify(historical),card.issueId);
  expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'old-answer',answer:'bean curd'},now)).toEqual(historical);
 }finally{db.close()}
});
