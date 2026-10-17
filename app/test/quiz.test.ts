import { it, expect, describe } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import { buildApp } from '../server/src/app.ts';
import { buildQuestion, issueQuestion, meaningSet, pickQtype } from '../server/src/quiz.ts';
import { review, setWrong, todaySummary } from '../server/src/study.ts';
import { card, database, seeded, T, day } from './v3-helpers.ts';

describe('question selection and distractors', () => {
  it('new recognition, disabled choices and spelling preserve their mode', () => {
    const c = { id: 1,word_id: 1,mode: 'recognize' as const,state: State.New };
    for (let i=0;i<100;i++) expect(pickQtype(c,seeded(i))).toBe('flip');
    expect(pickQtype({...c,state:State.Review},()=>.9,{choice_enabled:'0'})).toBe('flip');
    const random = seeded(); const types = new Set(Array.from({length:100},()=>pickQtype({...c,state:State.Review}, random)));
    expect([...types].sort()).toEqual(['flip','listen_choice','meaning_choice']);
    expect(pickQtype({...c,state:2},()=>.5,{choice_weights:'0,1,0'})).toBe('listen_choice');
    expect(pickQtype({...c,mode:'spell'})).toBe('spell');
  });
  it('excludes synonyms, normalized duplicate options, case variants and other sources', () => {
    const db=database(8); const id=card(db);
    db.prepare("UPDATE words SET headword='Miss',meaning_zh='n. 小姐（称呼）;老师\nv. 想念' WHERE id=1").run();
    for (const [h,m,source] of [['miss','n. 错过','kb2022'],['teacher','n. 老师','kb2022'],['think','v. 想念（某人）','kb2022'],['wrong-source','n. 外界','sample'],['dup','n. 义项2','kb2022']]) db.prepare('INSERT INTO words(headword,meaning_zh,source) VALUES (?,?,?)').run(h,m,source);
    for (const qtype of ['listen_choice','meaning_choice'] as const) {
      const q=buildQuestion(db,{id,word_id:1,mode:'recognize',state:2},qtype,seeded())!;
      expect(q.options).toHaveLength(4); expect(new Set(q.options.map(o=>o.text)).size).toBe(4);
      expect(q.options.filter(o=>o.wordId===1)).toHaveLength(1);
      expect(q.options.some(o=>[9,10,11,12].includes(o.wordId))).toBe(false);
      const sets=q.options.map(o=>meaningSet((db.prepare('SELECT meaning_zh FROM words WHERE id=?').get(o.wordId) as any).meaning_zh));
      for(let i=0;i<4;i++) for(let j=0;j<i;j++) expect([...sets[i]].some(s=>sets[j].has(s))).toBe(false);
    }
    db.close();
  });
  it('falls back when fewer than three distractors; manual meaning prompt is complete', () => {
    const db=database(3); const id=card(db);
    expect(issueQuestion(db,{id,word_id:1,mode:'recognize',state:2},T,'study',()=>.5)).toBeNull();
    db.prepare("INSERT INTO words(headword,meaning_zh,source) VALUES ('extra','n. 补充','kb2022')").run();
    db.prepare("UPDATE words SET meaning_source='manual',meaning_zh='n. 第一\nv. 第二\nadj. 第三\nadv. 第四' WHERE id=1").run();
    expect(buildQuestion(db,{id,word_id:1,mode:'recognize',state:2},'meaning_choice')!.prompt).toContain('第四');
    db.close();
  });
});

it('API reuses issued question and order, grades on server, is idempotent and rejects second answer keys', async () => {
  const db=database(); const id=card(db);
  const app=buildApp(db,{now:()=>T,rng:()=>.5});
  const next=(await app.inject('/api/next')).json(); const again=(await app.inject('/api/next')).json();
  expect(next.question).toEqual(again.question); expect(next.question.qtype).toBe('listen_choice');
  const wrong=next.question.options.find((o:any)=>o.wordId!==1).wordId;
  const body={questionId:next.question.id,choiceWordId:wrong,answerId:'choice-1',durationMs:1234};
  const post=async(payload:unknown)=>(await app.inject({method:'POST',url:'/api/answer',payload:payload as any}));
  const a=(await post(body)).json(); expect(a).toMatchObject({correct:false,answerWordId:1,chosenWordId:wrong,duplicate:false});
  expect((await post({...body,choiceWordId:1})).json()).toEqual({...a,duplicate:true});
  expect((await post({...body,answerId:'another'})).statusCode).toBe(409);
  expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:1});
  expect(db.prepare('SELECT rating,qtype,context,duration_ms FROM review_logs').get()).toEqual({rating:1,qtype:'listen_choice',context:'study',duration_ms:1234});
  expect(db.prepare('SELECT wrong_count FROM wrong_words').get()).toEqual({wrong_count:1});
  const question=issueQuestion(db,{id,word_id:1,mode:'recognize',state:1},day(1),'practice',()=>.9)!;
  const right=(await post({questionId:question.id,choiceWordId:1,answerId:'right'})).json();
  expect(right.correct).toBe(true);
  expect(db.prepare('SELECT rating,context FROM review_logs ORDER BY id DESC LIMIT 1').get()).toEqual({rating:3,context:'practice'});
  expect((await post({questionId:question.id,choiceWordId:999,answerId:'bad-option'})).statusCode).toBe(409);
  await app.close();db.close();
});

it('choice enabled/disabled has identical counts, cards and log volume at every step of a full day', async () => {
  const dbs=[database(),database()]; const apps=[];
  let now=T;
  for (const [i,db] of dbs.entries()) {
    db.prepare("UPDATE settings SET value=? WHERE key='choice_enabled'").run(String(1-i));
    db.prepare("UPDATE settings SET value='3' WHERE key='new_per_day'").run();
    for(let w=1;w<=5;w++) { const id=card(db,w,'recognize',State.New,day(-2).toISOString()); review(db,id,Rating.Good,day(-2)); }
    apps.push(buildApp(db,{now:()=>now,rng:seeded()}));
  }
  const seen=[new Set<number>(),new Set<number>()];
  // Traverse every minute of the Shanghai day, including later learning steps.
  for(let step=0;step<1440;step++) {
    now=new Date(Date.parse('2026-10-16T16:00:00Z')+step*60000);
    expect(todaySummary(dbs[0],now)).toEqual(todaySummary(dbs[1],now));
    const turns=await Promise.all(apps.map(a=>a.inject('/api/next')));
    const cs=turns.map(r=>r.json()); expect(cs[0].card?.id).toBe(cs[1].card?.id);
    if(!cs[0].card) continue;
    for(let i=0;i<2;i++) {
      const {card:c,question:q}=cs[i]; seen[i].add(c.id);
      const response=await apps[i].inject({method:'POST',url:q?'/api/answer':c.mode==='recognize'?'/api/review':'/api/check',payload:q?{questionId:q.id,choiceWordId:c.word_id,answerId:`step-${step}`} : c.mode==='recognize'?{cardId:c.id,rating:Rating.Good,answerId:`step-${step}`}:{cardId:c.id,answer:c.headword,answerId:`step-${step}`} });
      expect(response.statusCode).toBe(200);
    }
  }
  expect([...seen[0]]).toEqual([...seen[1]]);
  expect(dbs[0].prepare('SELECT * FROM cards').all()).toEqual(dbs[1].prepare('SELECT * FROM cards').all());
  expect(dbs[0].prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual(dbs[1].prepare('SELECT COUNT(*) n FROM review_logs').get());
  for(const a of apps) await a.close(); for(const db of dbs) db.close();
});
it('bad option is rejected without consuming the issue; flip, spell and dictation log their own type/context/duration',async()=>{
  const db=database();card(db);let now=T;const app=buildApp(db,{now:()=>now,rng:()=>.9});
  const turn=(await app.inject('/api/next')).json();
  expect((await app.inject({method:'POST',url:'/api/answer',payload:{questionId:turn.question.id,choiceWordId:9999,answerId:'bad'}})).statusCode).toBe(400);
  expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:0});
  // fix1：学习里有待答选择题时，practice 翻面自评也要 409；答完选择题、词在错词本里才接受
  expect((await app.inject({method:'POST',url:'/api/review',payload:{cardId:turn.card.id,rating:3,answerId:'flip',context:'practice',durationMs:100}})).statusCode).toBe(409);
  expect((await app.inject({method:'POST',url:'/api/answer',payload:{questionId:turn.question.id,choiceWordId:turn.card.word_id,answerId:'study-choice'}})).statusCode).toBe(200);
  setWrong(db,1,true,T);setWrong(db,2,true,T);
  const reviewResult=await app.inject({method:'POST',url:'/api/review',payload:{cardId:turn.card.id,rating:3,answerId:'flip',context:'practice',durationMs:100}});expect(reviewResult.statusCode).toBe(200);
  for(const mode of ['spell','dictation']){
    const cid=card(db,2,mode);now=day(1);
    expect((await app.inject({method:'POST',url:'/api/check',payload:{cardId:cid,answer:'word2',usedHint:mode==='spell',context:'practice',durationMs:250,answerId:mode}})).json().correct).toBe(true);
    expect(db.prepare('SELECT qtype,context,duration_ms FROM review_logs WHERE answer_id=?').get(mode)).toEqual({qtype:mode,context:'practice',duration_ms:250});
  }
  expect(db.prepare("SELECT qtype,context FROM review_logs WHERE answer_id='flip'").get()).toEqual({qtype:'flip',context:'practice'});
  await app.close();db.close();
});
