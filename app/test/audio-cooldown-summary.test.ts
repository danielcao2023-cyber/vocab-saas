import {expect,it,vi} from 'vitest';
import {makeV3Fixture,makeLegacyFixture} from './learning-v3-helpers';
import {startLearning,nextLearning,deferLearning,learningToday} from '../server/src/learning/engine';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {host,flush} from './p2-host';
const base=new Date('2026-10-21T01:00:00Z');const day=(n:number)=>new Date(+base+n*86400000);
function cooling(db:any,count:number){for(const n of [0,1]){startLearning(db,day(n));for(let i=0;i<count;i++){const c=nextLearning(db,day(n)).card!;db.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(c.issueId);deferLearning(db,c.issueId,day(n));}}db.prepare("UPDATE cards SET reps=1,due='2026-12-01T00:00:00.000Z' WHERE mode<>'dictation'").run();db.prepare("UPDATE learning_card_state SET delayed_successes=1,verification_due=NULL WHERE card_id IN (SELECT id FROM cards WHERE mode<>'dictation')").run();}
it('reports multiple pending audio retries without changing today quota or data',()=>{
 const db=makeV3Fixture(2,base);try{cooling(db,2);const before=db.serialize();const summary=learningToday(db,day(2));expect(summary).toMatchObject({total:0,backlog:0,audioCooldownCount:2,audioRetryDay:'2026-10-24'});expect(db.serialize()).toEqual(before);startLearning(db,day(2));expect(learningToday(db,day(2))).toMatchObject({total:0,audioCooldownCount:2,audioRetryDay:'2026-10-24'});}finally{db.close()}
});
it('shows a clear cooldown notice even with no ordinary task',async()=>{
 const summary={day:'2026-10-23',started:false,total:0,completed:0,deferred:0,newWords:0,reviewWords:0,remaining:0,backlog:0,answers:0,correct:0,books:{new:0,unfamiliar:0,familiar:0,mastered:0},audioCooldownCount:2,audioRetryDay:'2026-10-24'};
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json(summary)));const ui=host('web/src/views/LearningHomeView.vue');try{await flush();expect(ui.text()).toContain('2 个词的听写因读音不可用暂缓');expect(ui.text()).toContain('2026-10-24');expect(ui.text()).not.toContain('已掌握');}finally{ui.app.unmount();vi.unstubAllGlobals()}
});
it('documents legacy V2 technical deferral migration without inventing an answer or technical event',()=>{
 const db=makeLegacyFixture();try{startLearning(db,base);const c=nextLearning(db,base).card!;db.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(c.issueId);deferLearning(db,c.issueId,base);expect(learningToday(db,base)).toMatchObject({deferred:1,answers:0});activateEvidencePolicy(db,base);const summary=learningToday(db,base);expect(summary).toMatchObject({deferred:0,attempts:0,answers:0});expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:0});expect(db.prepare("SELECT kind,mode FROM learning_events").all()).toEqual([{kind:'exposure',mode:'dictation'}]);}finally{db.close()}
});
