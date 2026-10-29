import {expect,it,vi} from 'vitest';
import {host,flush} from './p2-host';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,deferLearning,answerLearning,learningToday} from '../server/src/learning/engine';
const card={issueId:'blocked',wordId:1,mode:'dictation',patterns:['_____'],audioWord:'above',options:[],assisted:false};
it('allows deferral after persistent blocking, retains retry guidance, and hides it after answering',async()=>{
 const retry=vi.fn(),defer=vi.fn();const ui=host('web/src/components/FocusStudyCard.vue',{card,answer:'',feedback:null,busy:false,audioFailed:'blocked',onPlay:retry,onDefer:defer});
 try{await flush();expect(ui.text()).toContain('请点击播放按钮启用读音');ui.all(n=>n.tag==='button'&&ui.text(n)==='重试播放')[0].props.onClick();expect(retry).toHaveBeenCalledOnce();
 ui.updateProps({audioFailed:'blocked'});await flush();const button=ui.all(n=>n.tag==='button'&&ui.text(n)==='暂缓此词');expect(button).toHaveLength(1);button[0].props.onClick();expect(defer).toHaveBeenCalledOnce();
 ui.updateProps({feedback:{correct:true,assisted:false,expected:'above',meaning:'上方',book:'familiar',nextDue:'2026-10-22'}});await flush();expect(ui.all(n=>n.tag==='button'&&ui.text(n)==='暂缓此词')).toHaveLength(0);
 }finally{ui.app.unmount();}
});
it('defers a blocked listening issue without a memory rating and continues to another word',()=>{
 const now=new Date('2026-10-21T01:00:00Z'),db=makeV3Fixture(2,now);try{startLearning(db,now);const old=nextLearning(db,now).card!;db.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(old.issueId);const before=db.prepare('SELECT * FROM cards WHERE word_id=?').all(old.wordId);
 expect(deferLearning(db,old.issueId,now)).toEqual({ok:true});expect(db.prepare('SELECT * FROM cards WHERE word_id=?').all(old.wordId)).toEqual(before);expect(db.prepare('SELECT count(*) n FROM review_logs').get()).toEqual({n:0});expect(learningToday(db,now)).toMatchObject({deferred:1,attempts:0});
 const next=nextLearning(db,now).card!;expect(next.wordId).not.toBe(old.wordId);const word=db.prepare('SELECT headword FROM words WHERE id=?').get(next.wordId) as {headword:string};answerLearning(db,{policyVersion:3,issueId:next.issueId,answerId:'next-word',...(next.mode==='recognize'?{choiceId:next.wordId}:{answer:word.headword})},now);expect(learningToday(db,now)).toMatchObject({deferred:1,attempts:1});
 }finally{db.close();}
});
