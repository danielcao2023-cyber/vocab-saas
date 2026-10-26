import {expect,it,vi} from 'vitest';
import {makeV3Fixture} from './learning-v3-helpers';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {installVocabulary,type Catalog} from '../server/src/vocabulary-import';
import {saveUserSettings,readUserSettings} from '../server/src/user-settings';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
const now=new Date('2026-10-26T01:00:00Z');
const catalog:Catalog={version:1,books:[{id:'high',title:'高中',category:'high',edition:'2019',sourceUrl:'https://book.pep.com.cn/'},{id:'cet4',title:'四级',category:'exam',edition:'词库',sourceUrl:'https://github.com/'}],units:[{id:'high:unit1',bookId:'high',title:'Unit 1',position:0}],entries:[{key:'experience',headword:'experience',meaning:'经验',memberships:[{bookId:'high',unitId:'high:unit1',position:0},{bookId:'cet4',unitId:null,position:0}]},{key:'newword',headword:'newword',meaning:'新词',memberships:[{bookId:'cet4',unitId:null,position:1}]}]};
it('retains independent recall history across books and restricts the daily plan to a selected unit',()=>{
 const db=makeV3Fixture(3,now);
 try{
  installVocabulary(db,catalog);saveVocabularySelection(db,{bookId:'high',unitId:'high:unit1'},now);startLearning(db,now);
  expect(db.prepare('SELECT DISTINCT word_id FROM learning_day_words').all()).toEqual([{word_id:1}]);
  const card=nextLearning(db,now).card!;answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'first',answer:'experience'},now);
  const evidence=db.prepare('SELECT * FROM learning_card_state').all();expect(evidence.length).toBeGreaterThan(0);
  saveVocabularySelection(db,{bookId:'cet4',unitId:null},now);
  expect(db.prepare('SELECT * FROM learning_card_state').all()).toEqual(evidence);
  const tomorrow=new Date(+now+86400000);startLearning(db,tomorrow);
  expect(db.prepare("SELECT DISTINCT word_id FROM learning_day_words WHERE day='2026-10-27' ORDER BY word_id").all()).toEqual([{word_id:1},{word_id:4}]);
  expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:1});
 }finally{db.close();}
});
it('rejects an invalid combined setting without committing any of the preferences',()=>{
 const db=makeV3Fixture(1,now);try{installVocabulary(db,catalog);const before=readUserSettings(db,now);expect(()=>saveUserSettings(db,{dailyWordLimit:20,playbackRate:0.75,dictationAutoPlay:false,vocabulary:{bookId:'cet4',unitId:'high:unit1'}},now)).toThrow();expect(readUserSettings(db,now)).toEqual(before);}finally{db.close();}
});
it('backs up before installing the catalog and preserves existing review data after export/reopen',async()=>{
 const node=makeV3Fixture(1,now);startLearning(node,now);const c=nextLearning(node,now).card!;answerLearning(node,{policyVersion:3,issueId:c.issueId,answerId:'old',answer:'experience'},now);const bytes=node.serialize(),logs=node.prepare('SELECT * FROM review_logs').all();node.close();
 const db=await openBrowserDatabase(bytes);let saved:Uint8Array|undefined;const order:string[]=[];
 try{
  await prepareVocabularyDatabase(db,catalog,{createVocabularyBackup:async b=>{expect(asSharedDb(db).prepare('SELECT COUNT(*) n FROM vocabulary_books').get()).toEqual({n:0});expect(b).toBeInstanceOf(Uint8Array);order.push('backup');},save:async b=>{saved=b;order.push('save');}},true);
  expect(order).toEqual(['backup','save']);expect(asSharedDb(db).prepare('SELECT * FROM review_logs').all()).toEqual(logs);
  const reopened=await openBrowserDatabase(saved!);try{expect(asSharedDb(reopened).prepare('SELECT * FROM review_logs').all()).toEqual(logs);const storage={save:vi.fn(),createVocabularyBackup:vi.fn()};await prepareVocabularyDatabase(reopened,catalog,storage,true);expect(storage.save).not.toHaveBeenCalled();expect(asSharedDb(reopened).prepare('SELECT COUNT(*) n FROM vocabulary_books').get()).toEqual({n:2});}finally{reopened.close();}
 }finally{db.close();}
});
it('does not import or persist if the upgrade backup fails',async()=>{
 const node=makeV3Fixture(1,now),db=await openBrowserDatabase(node.serialize());node.close();const save=vi.fn();try{await expect(prepareVocabularyDatabase(db,catalog,{createVocabularyBackup:async()=>{throw Error('backup failed');},save},true)).rejects.toThrow('backup failed');expect(save).not.toHaveBeenCalled();expect(asSharedDb(db).prepare('SELECT COUNT(*) n FROM vocabulary_books').get()).toEqual({n:0});}finally{db.close();}
});
