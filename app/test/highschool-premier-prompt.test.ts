import {expect,it} from 'vitest';
import {makeLegacyFixture,makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
const now=new Date('2026-10-21T01:00:00Z');
for(const v3 of [false,true])for(const offline of [false,true])for(const [word,hint] of [['premier','请写一个单词'],['prime minister','请写两个单词']] as const)it(`${v3?'V3':'V2'} ${offline?'offline':'online'} ${word} restores and disambiguates only its visible sense`,async()=>{
 const source=v3?makeV3Fixture():makeLegacyFixture();source.prepare('UPDATE words SET headword=?,meaning_zh=?,meaning_source=? WHERE id=1').run(word,'n. 总理，首相\nadj. 第一的','词库导入');startLearning(source,now);const issue=nextLearning(source,now).card!;source.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(issue.issueId);
 const mobile=offline?await openBrowserDatabase(source.serialize()):null,db=mobile?asSharedDb(mobile):source;if(mobile)source.close();try{
  let card=nextLearning(db,now).card!;expect(card.promptHint).toBe(hint);expect(card.issueId).toBe(issue.issueId);
  db.prepare("UPDATE words SET meaning_zh='adj. 第一的',meaning_source='manual' WHERE id=1").run();card=nextLearning(db,now).card!;expect(card.promptHint).toBeUndefined();
  db.prepare("UPDATE words SET meaning_zh='n. 副总理' WHERE id=1").run();expect(nextLearning(db,now).card?.promptHint).toBeUndefined();
  db.prepare("UPDATE words SET headword='another',meaning_zh='n. 总理' WHERE id=1").run();expect(nextLearning(db,now).card?.promptHint).toBeUndefined();
 }finally{mobile?mobile.close():source.close()}
});
import {translationPromptHint,acceptedAnswers} from '../server/src/study';
import {host,flush} from './p2-host';
import {vi} from 'vitest';
it('honors visible lines and exact senses, without accepting an alternative',()=>{
 expect(translationPromptHint('premier','n. 领导人\nn. 地区首脑\nn. 首相','词库导入')).toBeUndefined();
 expect(translationPromptHint('premier','n. 领导人\nn. 地区首脑\nn. 首相','manual')).toBe('请写一个单词');
 expect(translationPromptHint('premier','n. 不是首相')).toBeUndefined();
 expect(translationPromptHint('prime minister','n. 首相')).toBe('请写两个单词');
 expect(acceptedAnswers('premier','spell','n. 总理')).toEqual(['premier']);
});
it('renders an accessible text prompt only on the spelling card',async()=>{
 const make=(mode:'spell'|'dictation',promptHint?:string)=>host('web/src/components/FocusStudyCard.vue',{card:{issueId:'i',wordId:1,mode,patterns:['_______'],meaning:'n. 总理',promptHint,options:[],assisted:false},answer:'',feedback:null,busy:false,audioFailed:null,'onUpdate:answer':vi.fn()});
 const spell=make('spell','请写一个单词');try{await flush();expect(spell.text(spell.root)).toContain('请写一个单词');expect(spell.all(n=>n.tag==='p'&&spell.text(n)==='请写一个单词')).toHaveLength(1)}finally{spell.app.unmount()}
 const ordinary=make('spell');try{await flush();expect(ordinary.text(ordinary.root)).not.toContain('请写一个单词')}finally{ordinary.app.unmount()}
 const dictation=make('dictation','请写一个单词');try{await flush();expect(dictation.text(dictation.root)).not.toContain('请写一个单词')}finally{dictation.app.unmount()}
});
for(const v3 of [false,true])it(`${v3?'V3':'V2'} keeps previous response replay unchanged and does not change grading`,()=>{
 const db=v3?makeV3Fixture():makeLegacyFixture();try{db.prepare("UPDATE words SET headword='premier',meaning_zh='n. 总理，首相' WHERE id=1").run();startLearning(db,now);const card=nextLearning(db,now).card!;db.prepare("UPDATE learning_issues SET mode='spell' WHERE id=?").run(card.issueId);
 const old={correct:false,expected:'premier',historical:true};db.prepare('UPDATE learning_issues SET answered_at=?,answer_id=?,result_json=? WHERE id=?').run(now.toISOString(),'old',JSON.stringify(old),card.issueId);
 expect(answerLearning(db,{policyVersion:3,issueId:card.issueId,answerId:'old',answer:'prime minister'},now)).toEqual(old);
 }finally{db.close()}
});
