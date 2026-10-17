import { it, expect } from 'vitest';
import { Rating } from 'ts-fsrs';
import { nextCard, queueState, review } from '../server/src/study.ts';
import { makeup, queueStateAt, recomputeDailyStats, shiftDay, streak } from '../server/src/stats.ts';
import { buildApp } from '../server/src/app.ts';
import { database, T, day, seeded, card } from './v3-helpers.ts';

it('reconstructs live and historical queues for randomized histories including non-counted practices',()=>{
  for(let seed=1;seed<=10;seed++) {
    const db=database(8),rng=seeded(seed);const checkpoints:{at:Date;q:unknown}[]=[];
    db.prepare("UPDATE settings SET value='3' WHERE key='new_per_day'").run();
    for(let d=0;d<10;d++) {
      for(let j=0;j<12;j++) {
        const now=new Date(day(d).getTime()+j*900000);
        const c=nextCard(db,now);
        if(c) review(db,c.id,([1,2,3,4] as const)[Math.floor(rng()*4)],now,{context:rng()<.3?'practice':'study'});
        expect(queueStateAt(db,now)).toEqual(queueState(db,now));
        checkpoints.push({at:now,q:queueState(db,now)});
      }
    }
    // Future cards and later answers must not leak into reconstruction.
    for(const p of checkpoints) expect(queueStateAt(db,p.at), `seed=${seed} at=${p.at.toISOString()}`).toEqual(p.q);
    db.close();
  }
});
it('Shanghai midnight, exact completion time, repeatable stats and duration cap',()=>{
  const db=database(2);db.prepare("UPDATE settings SET value='1' WHERE key='new_per_day'").run();
  const before=new Date('2026-10-16T15:59:00Z'),after=new Date('2026-10-16T16:00:00Z');
  const a=nextCard(db,before)!;review(db,a.id,Rating.Easy,before,{durationMs:400000});
  expect(db.prepare("SELECT completed,completed_at,duration_ms FROM daily_stats WHERE day='2026-10-16'").get()).toEqual({completed:1,completed_at:before.toISOString(),duration_ms:300000});
  const b=nextCard(db,after)!;review(db,b.id,Rating.Good,after,{durationMs:100});
  // Spell/dictation of the first word are due now; quota alone is insufficient.
  expect(db.prepare("SELECT completed FROM daily_stats WHERE day='2026-10-17'").get()).toEqual({completed:0});
  let c;while((c=nextCard(db,after)))review(db,c.id,Rating.Easy,after);
  expect(db.prepare("SELECT new_count,completed FROM daily_stats WHERE day='2026-10-17'").get()).toEqual({new_count:1,completed:1});
  expect(streak(db,after).current).toBe(2);
  const original=db.prepare('SELECT * FROM daily_stats ORDER BY day').all();db.exec('DELETE FROM daily_stats');recomputeDailyStats(db);
  expect(db.prepare('SELECT * FROM daily_stats ORDER BY day').all()).toEqual(original);recomputeDailyStats(db);
  expect(db.prepare('SELECT * FROM daily_stats ORDER BY day').all()).toEqual(original);db.close();
});
it('mastery crossings use post-review stability, not the log pre-review value',()=>{
  const db=database(1);const id=card(db);db.prepare('UPDATE cards SET stability=20 WHERE id=?').run(id);
  review(db,id,Rating.Easy,T); const result=(db.prepare('SELECT stability FROM cards').get() as any).stability;
  expect((db.prepare('SELECT mastered_new FROM daily_stats').get() as any).mastered_new).toBe(Number(result>=21));db.close();
});
it('makeup enforces all settings, crosses months correctly, and milestones use best while progress uses current',()=>{
  const db=database(1);db.prepare("UPDATE settings SET value='0' WHERE key='new_per_day'").run();
  const id=card(db,1,'recognize',2,day(-20).toISOString());
  for(const d of [-10,-7,-5,-2]) review(db,id,Rating.Easy,day(d));
  expect(()=>makeup(db,shiftDay('2026-10-17',-1),T)).toThrow('先完成');
  review(db,id,Rating.Easy,T);
  expect(()=>makeup(db,'2026-10-17',T)).toThrow('之前');
  expect(()=>makeup(db,'2026-10-06',T)).toThrow('开始');
  expect(()=>makeup(db,'2026-10-09',T)).toThrow('超出');
  expect(()=>makeup(db,'2026-10-15',T)).toThrow('已完成');
  expect(()=>makeup(db,'2026-02-30',T)).toThrow('无效');
  makeup(db,'2026-10-16',T);expect(streak(db,T).current).toBe(3);
  makeup(db,'2026-10-14',T);expect(()=>makeup(db,'2026-10-13',T)).toThrow('用完');
  expect(streak(db,T).makeupLeft).toBe(0);
  for(const [key,value] of [['makeup_per_month','4'],['makeup_window_days','20'],['makeup_requires_today','0']])db.prepare('UPDATE settings SET value=? WHERE key=?').run(value,key);
  expect(()=>makeup(db,'2026-10-09',day(1))).not.toThrow();
  db.exec('DELETE FROM daily_stats;DELETE FROM streak_makeups');
  // Streak calculation consumes the derived completed flag, independent of answer counts.
  const ins=db.prepare('INSERT INTO daily_stats VALUES (?,0,1,0,1,1,0,0,1,?,?)');
  for(let i=0;i<100;i++){const d=shiftDay('2026-10-17',i-99);ins.run(d,d+'T01:00:00Z',d+'T01:00:00Z');}
  expect(streak(db,T)).toMatchObject({current:100,best:100,badges:[{days:7,earned:true,progress:7},{days:30,earned:true,progress:30},{days:100,earned:true,progress:100}]});
  db.close();
});
it('streak API calendars distinguish before_start, missed, today, future, makeup and done',async()=>{
  const db=database(1);const id=card(db);db.prepare("UPDATE settings SET value='0' WHERE key='new_per_day'").run();
  review(db,id,Rating.Easy,day(-2));review(db,id,Rating.Easy,T);
  const app=buildApp(db,{now:()=>T});
  const post=await app.inject({method:'POST',url:'/api/streak/makeup',payload:{day:'2026-10-16'}});expect(post.statusCode).toBe(200);
  const s=(await app.inject('/api/streak?month=2026-10')).json();
  const status=(day:string)=>s.calendar.find((d:any)=>d.day===day).status;
  expect(status('2026-10-14')).toBe('before_start');expect(status('2026-10-15')).toBe('done');expect(status('2026-10-16')).toBe('makeup');expect(status('2026-10-18')).toBe('future');
  expect((await app.inject('/api/streak?month=wrong')).statusCode).toBe(400);await app.close();db.close();
});
it('legacy ts-fsrs learning due can be recovered without rewriting a single log',()=>{
  const db=database(2);const times=[T,new Date(T.getTime()+120000),new Date(T.getTime()+1800000),day(1)];
  const points:{at:Date;q:unknown}[]=[];
  let id=0;
  for(const now of times){const c=nextCard(db,now)!;id=c.id;review(db,id,Rating.Good,now);points.push({at:now,q:queueState(db,now)});}
  // Emulate pre-v3 scheduler.log.due for learning steps (last_review).
  const rows=db.prepare('SELECT * FROM review_logs ORDER BY id').all() as any[];
  const previous=new Map<number,string>();
  for(const l of rows){if(l.state===1||l.state===3)db.prepare('UPDATE review_logs SET due=?,qtype=NULL,counted=NULL,context=NULL WHERE id=?').run(previous.get(l.card_id)??l.due,l.id);previous.set(l.card_id,l.review_at);}
  const before=db.prepare('SELECT * FROM review_logs').all();
  for(const p of points)expect(queueStateAt(db,p.at)).toEqual(p.q);
  recomputeDailyStats(db);expect(db.prepare('SELECT * FROM review_logs').all()).toEqual(before);db.close();
});
it('makeup allowance belongs to the target month, not used_at month; completed and today requirements are independent settings',()=>{
  const db=database(1);db.prepare("UPDATE settings SET value='0' WHERE key='new_per_day'").run();
  const sept=new Date('2026-09-29T01:00:00Z'),oct=new Date('2026-10-02T01:00:00Z');const id=card(db,1,'recognize',2,sept.toISOString());
  review(db,id,Rating.Easy,sept);review(db,id,Rating.Easy,oct);
  makeup(db,'2026-09-30',oct);
  expect(streak(db,oct,'2026-09').makeupLeft).toBe(1);expect(streak(db,oct,'2026-10').makeupLeft).toBe(2);
  expect(streak(db,oct).makeupCandidates).toContain('2026-10-01');db.close();
});
it('reaching review_limit completes the capped queue even if additional physical cards are due',()=>{
  const db=database(2);db.prepare("UPDATE settings SET value='0' WHERE key='new_per_day'").run();db.prepare("UPDATE settings SET value='1' WHERE key='review_limit'").run();
  const a=card(db,1);card(db,2);
  expect(queueState(db,T).review).toBe(1);review(db,a,Rating.Good,T);
  expect(queueStateAt(db,T)).toEqual({review:0,new:0});expect(db.prepare('SELECT completed FROM daily_stats').get()).toEqual({completed:1});db.close();
});
it('live queue reconstruction also respects pre-existing cards without a complete log history',()=>{
  const db=database(3);const id=card(db,1,'recognize',0);review(db,id,Rating.Good,day(-1));
  // Imported or diagnostic fixtures may have existing unreviewed cards with an adjusted due.
  db.prepare("UPDATE cards SET due=? WHERE word_id=1 AND mode='spell'").run(T.toISOString());
  card(db,2,'recognize',2,T.toISOString());card(db,3,'dictation',0,T.toISOString());
  expect(queueStateAt(db,T)).toEqual(queueState(db,T));db.close();
});
