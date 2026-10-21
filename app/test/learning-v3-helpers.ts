import {nextLearning,answerLearning} from '../server/src/learning/engine';
import type {LearningResultV3} from '../shared/learning';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {openDb,type DB} from '../server/src/db';
export function makeLegacyFixture(n=1):DB {
 const db=openDb(':memory:');
 for(let i=1;i<=n;i++)db.prepare('INSERT INTO words(id,headword,meaning_zh,source,priority,freq_rank) VALUES (?,?,?,?,?,?)').run(i,i===1?'experience':'word'+String.fromCharCode(97+i%26)+String.fromCharCode(97+Math.floor(i/26)),i===1?'经验':'释义'+i,'kb2022',i%10<7?2:1,i);
 return db;
}

export function makeV3Fixture(n=1,now=new Date('2026-10-21T01:00:00Z')):DB {const db=makeLegacyFixture(n);activateEvidencePolicy(db,now);return db;}

export function answerCurrent(db:DB,now:Date,correct:boolean,id:string):LearningResultV3 {const c=nextLearning(db,now).card;if(!c)throw new Error('No current card');const w=db.prepare('SELECT headword FROM words WHERE id=?').get(c.wordId) as {headword:string};return answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:id,...(c.mode==='recognize'?{choiceId:correct?c.wordId:0}:{answer:correct?w.headword:'wrong'})},now) as LearningResultV3;}
