import {describe,expect,it} from 'vitest';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {acceptedSpellings,checkSpelling} from '../server/src/study';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
const now=new Date('2026-10-21T01:00:00Z');
const pairs=[['defence','defense'],['defense','defence'],['advisor','adviser'],['adviser','advisor'],['chilli','chili'],['chili','chilli'],['fibre','fiber'],['fiber','fibre']] as const;

describe('explicit accepted textbook spelling alternatives',()=>{
 it.each(pairs)('%s accepts %s with the original first', (main,other)=>expect(acceptedSpellings(main)).toEqual([main,other]));
 it('preserves normal variants and never expands unrelated or partial words',()=>{
  expect(acceptedSpellings('color (colour)')).toEqual(['color','colour']);expect(acceptedSpellings('defensive')).toEqual(['defensive']);expect(acceptedSpellings('chill')).toEqual(['chill']);
  expect(acceptedSpellings('DEFENCE')).toEqual(['defence','defense']);
 });
});
for(const v3 of [false,true])for(const offline of [false,true])for(const mode of ['spell','dictation'] as const)describe(`policy ${v3?3:2} ${offline?'offline':'online'} ${mode}`,()=>{
 it.each(pairs)('restores an already issued %s question, accepts %s, and preserves identity',async(main,other)=>{
  const source=v3?makeV3Fixture():makeLegacyFixture();source.prepare('UPDATE words SET headword=? WHERE id=1').run(main);startLearning(source,now);
  const issued=nextLearning(source,now).card!;source.prepare('UPDATE learning_issues SET mode=? WHERE id=?').run(mode,issued.issueId);
  const mobile=offline?await openBrowserDatabase(source.serialize()):null;const db=mobile?asSharedDb(mobile):source;if(mobile)source.close();
  try{const card=nextLearning(db,now).card!;expect(card.issueId).toBe(issued.issueId);expect(card.wordId).toBe(1);expect(card.mode).toBe(mode);
   expect(card.patterns).toEqual([...new Set([main,other].map(x=>'_'.repeat(x.length)))]);if(mode==='dictation')expect(card.audioWord).toBe(main);
   const result=answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'accepted',answer:other.toUpperCase()},now);expect(result.correct).toBe(true);expect(result.expected).toBe(main);
   expect((db.prepare('SELECT headword FROM words WHERE id=1').get() as {headword:string}).headword).toBe(main);
   expect((db.prepare('SELECT COUNT(*) n FROM words').get() as {n:number}).n).toBe(1);
  }finally{if(mobile)mobile.close();else source.close()}
 });
 it('shows the original spelling on an incorrect answer',async()=>{
  const source=v3?makeV3Fixture():makeLegacyFixture();source.prepare("UPDATE words SET headword='chilli' WHERE id=1").run();startLearning(source,now);const old=nextLearning(source,now).card!;source.prepare('UPDATE learning_issues SET mode=? WHERE id=?').run(mode,old.issueId);
  const mobile=offline?await openBrowserDatabase(source.serialize()):null;const db=mobile?asSharedDb(mobile):source;if(mobile)source.close();try{const card=nextLearning(db,now).card!;const result=answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'wrong',answer:'chillo'},now);expect(result.correct).toBe(false);expect(result.expected).toBe('chilli')}finally{if(mobile)mobile.close();else source.close()}
 });
});
it.each(pairs)('legacy checkSpelling accepts %s -> %s', (main,other)=>{
 const db=makeLegacyFixture();try{db.prepare('UPDATE words SET headword=? WHERE id=1').run(main);startLearning(db,now);const card=db.prepare("SELECT id FROM cards WHERE word_id=1 AND mode='spell'").get() as {id:number};expect(checkSpelling(db,card.id,other,now).correct).toBe(true)}finally{db.close()}
});
for(const v3 of [false,true])it(`keeps separate same-meaning word records under policy ${v3?3:2}`,()=>{
 const db=v3?makeV3Fixture(2):makeLegacyFixture(2);try{
  db.prepare("UPDATE words SET headword='fibre' WHERE id=1").run();db.prepare("UPDATE words SET headword='fiber' WHERE id=2").run();startLearning(db,now);
  const issue=nextLearning(db,now).card!;expect(issue.wordId).toBe(1);db.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(issue.issueId);
  const before=db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all();const result=answerLearning(db,{policyVersion:3,issueId:issue.issueId,answerId:'one-record',answer:'fiber'},now);
  expect(result.correct).toBe(true);expect(db.prepare('SELECT id,headword FROM words ORDER BY id').all()).toEqual([{id:1,headword:'fibre'},{id:2,headword:'fiber'}]);
  expect(db.prepare('SELECT * FROM cards WHERE word_id=2 ORDER BY id').all()).toEqual(before);
 }finally{db.close()}
});
