import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
import {describe,expect,it} from 'vitest';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {pronunciationHeadword} from '../web/src/audio';
const t=new Date('2026-10-21T01:00:00Z');
for(const v3 of [false,true])for(const offline of [false,true])describe(`${v3?'V3':'V2'} ${offline?'offline':'online'}`,()=>{
 it.each([['BCE','bce'],['UNICEF','unicef'],['Sri Lanka','sri lanka'],['chilli','CHILI'],['experience','EXPERIENCE']])('preserves %s audio on a restored issue and accepts %s',async(word,answer)=>{
  const source=v3?makeV3Fixture():makeLegacyFixture();source.prepare('UPDATE words SET headword=? WHERE id=1').run(word);startLearning(source,t);const issue=nextLearning(source,t).card!;source.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(issue.issueId);
  const mobile=offline?await openBrowserDatabase(source.serialize()):null;const db=mobile?asSharedDb(mobile):source;if(mobile)source.close();
  try{const card=nextLearning(db,t).card!;expect(card.issueId).toBe(issue.issueId);expect(card.audioWord).toBe(word);const result=answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'answer',answer},t);expect(result.correct).toBe(true);expect((db.prepare('SELECT headword FROM words WHERE id=1').get() as any).headword).toBe(word);}finally{if(mobile)mobile.close();else source.close();}
 });
});
it('actual offline bundle addresses retain the exact case of the issued word',()=>{
 const manifest=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8'));const words=['BCE','UNICEF','Sri Lanka'];const dir=mkdtempSync(join(tmpdir(),'case-audio-'));try{const entries=Object.fromEntries(words.map(word=>[word,manifest.entries[word]]));const packed=packPronunciations({version:1,entries},'data/pronunciation',dir).recordings;for(const word of words){expect(packed[pronunciationHeadword(word)]?.file).toMatch(/^\/offline\/recordings\//);expect(packed[word.toLowerCase()]).toBeUndefined();}}finally{rmSync(dir,{recursive:true,force:true});}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} preserves old issued mixed and parenthetical headwords while resolving only the spoken form`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{db.prepare("UPDATE words SET headword='host / hostess' WHERE id=1").run();startLearning(db,t);const first=nextLearning(db,t).card!;db.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(first.issueId);let card=nextLearning(db,t).card!;expect(card.audioWord).toBe('host / hostess');expect(pronunciationHeadword(card.audioWord!)).toBe('host');expect(card).not.toHaveProperty('headword');
 db.prepare("UPDATE words SET headword='organise (AmE organize)' WHERE id=1").run();card=nextLearning(db,t).card!;expect(card.issueId).toBe(first.issueId);expect(pronunciationHeadword(card.audioWord!)).toBe('organise');expect(card).not.toHaveProperty('headword');expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'variant',answer:'organize'},t).correct).toBe(true);
 }finally{db.close();}
});
it('real online recording route returns bundled bytes for uppercase BCE',async()=>{
 const {openDb}=await import('../server/src/db');const {buildApp}=await import('../server/src/app');const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('BCE','test')").run();const app=buildApp(db,{pronunciationDir:process.cwd()+'/data/pronunciation'});try{const good=await app.inject('/api/pronunciation/audio?word=BCE'),wrong=await app.inject('/api/pronunciation/audio?word=bce');expect(good.statusCode).toBe(200);expect(good.headers['content-type']).toContain('audio/mpeg');expect(wrong.statusCode).not.toBe(200);}finally{await app.close();db.close();}
});
