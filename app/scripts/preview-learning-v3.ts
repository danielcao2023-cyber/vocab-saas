import {protectTarget} from '../server/src/guard.ts';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration.ts';
/** Read-only, redacted migration preview. Never opens a source database for writing. */
import fs from 'node:fs';
import {openDb} from '../server/src/db.ts';
import {makeLegacyFixture} from '../test/learning-v3-helpers.ts';
import {startLearning,nextLearning,consultLearning,answerLearning} from '../server/src/learning/engine.ts';
const args=process.argv.slice(2),synthetic=args.includes('--synthetic');
const arg=(key:string)=>args[args.indexOf(key)+1];
if(!synthetic&&(!args.includes('--db')||!args.includes('--dry-run')||!args.includes('--report')))throw new Error('Use --synthetic or --db <path> --dry-run --report <path>');
if(!synthetic)protectTarget(arg('--db'));
const db=synthetic?makeLegacyFixture():openDb(arg('--db'),{dryRun:true});
try{
 if(synthetic){const now=new Date('2026-10-21T01:00:00Z');startLearning(db,now);for(let i=0;i<3;i++){const t=nextLearning(db,now);if(!t.card)break;if(i<2)consultLearning(db,t.card.issueId,now);answerLearning(db,{issueId:t.card.issueId,answerId:'synthetic-'+i,...(t.card.mode==='recognize'?{choiceId:1}:{answer:'experience'})},now);}}
 const migration=activateEvidencePolicy(db,new Date());
 const report={synthetic,migration,words:db.prepare('SELECT COUNT(*) n FROM words').get(),books:db.prepare('SELECT book,COUNT(*) n FROM learning_words GROUP BY book').all(),ratings:db.prepare('SELECT rating,COUNT(*) n FROM review_logs GROUP BY rating').all(),help:db.prepare('SELECT COUNT(*) n FROM learning_issues WHERE assisted=1').get(),cards:db.prepare('SELECT id,due,reps FROM cards').all()};
 const text=JSON.stringify(report,null,2);if(args.includes('--report'))fs.writeFileSync(arg('--report'),text);else console.log(text);
}finally{db.close();}
