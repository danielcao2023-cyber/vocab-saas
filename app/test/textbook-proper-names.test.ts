import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {makeV3Fixture,makeLegacyFixture} from './learning-v3-helpers';
import {installVocabulary,type Catalog} from '../server/src/vocabulary-import';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
import {hasDictionaryPlaceholder} from '../server/src/text';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {createLessonReader} from '../server/src/lessons';
const now=new Date('2026-10-21T01:00:00Z');
const names=['Portsmouth Square','Sputnik 1','Voyager 1','Soyuz 11'];
const olds=['Portsmouth','Sputnik','Voyager','Soyuz'];
const units=['pep2019-compulsory-3:unit3','pep2019-compulsory-3:unit4','pep2019-compulsory-3:unit4','pep2019-compulsory-3:unit4'];
const data=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8')) as Catalog;
const compact=()=>({...data,books:data.books.filter(b=>b.id==='pep2019-compulsory-3'),units:data.units.filter(u=>units.includes(u.id)),entries:data.entries.filter(e=>[...names,...olds].includes(e.key)).map(e=>({...e,memberships:e.memberships.filter(m=>m.bookId==='pep2019-compulsory-3'&&units.includes(m.unitId??''))}))});
it('creates the four specific names independently with only textbook membership and recognition',()=>{
 const db=makeV3Fixture();try{installVocabulary(db,compact());for(let i=0;i<4;i++){
 const old=db.prepare('SELECT id FROM words WHERE headword=?').get(olds[i]) as any,word=db.prepare('SELECT id FROM words WHERE headword=?').get(names[i]) as any;
 expect(word, names[i]).toBeTruthy();expect(word.id).not.toBe(old.id);expect(hasDictionaryPlaceholder(names[i])).toBe(true);
 expect(createLessonReader()({id:word.id,headword:names[i]}).status).toBe('ready');
 expect(db.prepare('SELECT word_id FROM vocabulary_members WHERE unit_id=? AND word_id IN (?,?)').all(units[i],word.id,old.id)).toEqual([{word_id:word.id}]);
 expect(db.prepare('SELECT COUNT(*) n FROM learning_events WHERE word_id=?').get(word.id)).toEqual({n:0});
 }}finally{db.close();}
});
it('keeps completed old evidence on the old word and does not transfer it to the new name',()=>{
 const original=compact(),legacy={...original,version:original.version-1,entries:original.entries.filter(e=>olds.includes(e.key)).map((e,i)=>{const {retiredMemberships:_,...previous}=e;return {...previous,memberships:[{bookId:'pep2019-compulsory-3',unitId:units[olds.indexOf(e.key)],position:i}]};})};
 const db=makeV3Fixture();try{installVocabulary(db,legacy);saveVocabularySelection(db,{bookId:'pep2019-compulsory-3',unitId:'pep2019-compulsory-3:unit4'},now);startLearning(db,now);
 const card=nextLearning(db,now).card!;const name=(db.prepare('SELECT headword FROM words WHERE id=?').get(card.wordId) as any).headword;
 answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'old-completed',...(card.mode==='recognize'?{choiceId:card.wordId}:{answer:name})},now);
 const events=db.prepare('SELECT * FROM learning_events ORDER BY id').all(),logs=db.prepare('SELECT * FROM review_logs').all();expect(events.length).toBeGreaterThan(0);installVocabulary(db,original);
 expect(db.prepare('SELECT * FROM learning_events ORDER BY id').all()).toEqual(events);expect(db.prepare('SELECT * FROM review_logs').all()).toEqual(logs);
 const newName=names[olds.indexOf(name)],newId=(db.prepare('SELECT id FROM words WHERE headword=?').get(newName) as any).id;expect(db.prepare('SELECT COUNT(*) n FROM learning_events WHERE word_id=?').get(newId)).toEqual({n:0});
 }finally{db.close();}
});
it('upgrades old membership without changing old evidence or an already published question, including offline reopen',async()=>{
 const original=compact(),legacy={...original,version:original.version-1,entries:original.entries.filter(e=>olds.includes(e.key)).map((e,i)=>{const {retiredMemberships:_,...previous}=e;return {...previous,memberships:[{bookId:'pep2019-compulsory-3',unitId:units[olds.indexOf(e.key)],position:i}]};})};
 const node=makeV3Fixture();installVocabulary(node,legacy);const old=(node.prepare("SELECT id FROM words WHERE headword='Voyager'").get() as any).id;
 node.prepare('UPDATE words SET freq_rank=1 WHERE id=?').run(old);startLearning(node,now);
 const before=node.prepare('SELECT * FROM learning_issues').all();const snapshots=node.prepare('SELECT * FROM learning_day_words').all();
 const mobile=await openBrowserDatabase(node.serialize());node.close();let saved:Uint8Array|undefined;
 try{await prepareVocabularyDatabase(mobile,original,{createVocabularyBackup:async()=>{},save:async bytes=>{saved=bytes;}},true);const db=asSharedDb(mobile);
 expect(db.prepare('SELECT * FROM learning_issues').all()).toEqual(before);expect(db.prepare('SELECT * FROM learning_day_words').all()).toEqual(snapshots);
 const oldId=(db.prepare("SELECT id FROM words WHERE headword='Voyager'").get() as any).id,newId=(db.prepare("SELECT id FROM words WHERE headword='Voyager 1'").get() as any).id;expect(oldId).toBe(old);expect(newId).not.toBe(old);
 const reopened=await openBrowserDatabase(saved!);try{expect(asSharedDb(reopened).prepare('SELECT * FROM learning_day_words').all()).toEqual(snapshots);expect(asSharedDb(reopened).prepare('SELECT COUNT(*) n FROM learning_events WHERE word_id=?').get(newId)).toEqual({n:0});}finally{reopened.close();}
 }finally{mobile.close();}
});
for(const v3 of [false,true])it(`continues an already issued old unit card after replacement for policy ${v3?3:2}`,()=>{
 const original=compact(),legacy={...original,version:original.version-1,entries:original.entries.filter(e=>olds.includes(e.key)).map((e,i)=>{const {retiredMemberships:_,...previous}=e;return {...previous,memberships:[{bookId:'pep2019-compulsory-3',unitId:units[olds.indexOf(e.key)],position:i}]};})};
 const db=v3?makeV3Fixture():makeLegacyFixture();try{installVocabulary(db,legacy);saveVocabularySelection(db,{bookId:'pep2019-compulsory-3',unitId:'pep2019-compulsory-3:unit4'},now);startLearning(db,now);
 const old=nextLearning(db,now).card!;expect(old).toBeTruthy();installVocabulary(db,original);
 const current=nextLearning(db,now).card!;expect(current.issueId).toBe(old.issueId);expect(current.wordId).toBe(old.wordId);
 const head=(db.prepare('SELECT headword FROM words WHERE id=?').get(old.wordId) as any).headword;
 expect(()=>answerLearning(db,{policyVersion:3,issueId:old.issueId,answerId:'old-issued',...(old.mode==='recognize'?{choiceId:old.wordId}:{answer:head})},now)).not.toThrow();
 }finally{db.close();}
});
