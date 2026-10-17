import { it,expect } from 'vitest';
import { Rating } from 'ts-fsrs';
import { parentSummary } from '../server/src/stats.ts';
import { review,setWrong } from '../server/src/study.ts';
import { buildApp } from '../server/src/app.ts';
import { database,card,T,day } from './v3-helpers.ts';
import { shDayStart } from '../server/src/time.ts';
it('parent daily numbers match manual SQL on three days; readonly except recomputing today',async()=>{
  const db=database(30);const id=card(db);db.prepare("UPDATE settings SET value='0' WHERE key='new_per_day'").run();
  for(const d of [-2,-1,0]) {
    review(db,id,Rating.Again,day(d),{durationMs:400000,qtype:'listen_choice'});
    review(db,id,Rating.Good,day(d),{durationMs:60000,context:'practice'});
  }
  for(let w=2;w<=30;w++){const cid=card(db,w);review(db,cid,Rating.Again,T,{qtype:w%2?'meaning_choice':'flip'});}
  setWrong(db,1,false,T);
  const tables=['words','cards','review_logs','wrong_words','settings','question_issues','streak_makeups'];
  const snapshot=()=>tables.map(t=>db.prepare(`SELECT * FROM ${t}`).all()); const before=snapshot();
  const historical=db.prepare("SELECT * FROM daily_stats WHERE day<>'2026-10-17'").all();
  const p=parentSummary(db,T);
  for(const d of [-2,-1,0]){
    const start=shDayStart(day(d)).toISOString(),end=new Date(shDayStart(day(d)).getTime()+86400000).toISOString();
    const sql=db.prepare(`SELECT COUNT(*) answers,SUM(COALESCE(correct,rating>1)) correct,SUM(MIN(COALESCE(duration_ms,0),300000)) durationMs,
      SUM(COALESCE(counted,1)=0) practice,SUM(l.state<>0 AND COALESCE(counted,1)<>0) review,
      SUM(c.mode='recognize' AND l.state=0 AND COALESCE(counted,1)<>0) AS new
      FROM review_logs l JOIN cards c ON c.id=l.card_id WHERE review_at>=? AND review_at<?`).get(start,end) as any;
    const daily=p.daily.find(r=>r.day===new Date(day(d).getTime()+28800000).toISOString().slice(0,10))!;
    expect(daily).toMatchObject(sql);expect(daily.accuracy).toBe(sql.correct/sql.answers);
  }
  expect(snapshot()).toEqual(before);expect(db.prepare("SELECT * FROM daily_stats WHERE day<>'2026-10-17'").all()).toEqual(historical);
  expect(p.wrongTop20).toHaveLength(20);expect(p.wrongTop20.find(w=>w.headword==='word1')!.inBook).toBe(false);
  expect(p.progress.core.total).toBe(20);expect(p.progress.level2.total).toBe(10);
  expect(p.totals.studyDays).toBe(3);expect(p.totals.thisWeek.studyDays).toBe(3);
  const app=buildApp(db,{now:()=>T});expect((await app.inject('/api/parent/summary')).json()).toEqual(p);
  expect((await app.inject('/api/parent/summary?days=999')).statusCode).toBe(400);
  expect(snapshot()).toEqual(before);await app.close();db.close();
});
