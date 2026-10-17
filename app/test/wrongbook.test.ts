import { it,expect } from 'vitest';
import { Rating } from 'ts-fsrs';
import { countsTowardGraduation, review, setWrong, wrongList, wrongPractice, wrongSummary, reviewedToday, newIntroducedToday } from '../server/src/study.ts';
import { card,database,T,day,seeded } from './v3-helpers.ts';
it('sorts by count or recent, infers legacy qtype and counts words with exactly two distinct correct days',()=>{
  const db=database(); const a=card(db,1),b=card(db,2);
  review(db,a,Rating.Again,day(-3));review(db,a,Rating.Again,day(-2));review(db,b,Rating.Again,day(-1),{qtype:'meaning_choice',correct:false});
  db.prepare('UPDATE review_logs SET qtype=NULL WHERE card_id=?').run(a);
  expect(wrongList(db).map(w=>w.word_id)).toEqual([1,2]);expect(wrongList(db,'recent').map(w=>w.word_id)).toEqual([2,1]);
  expect(wrongList(db)[0].fails).toEqual({flip:2}); expect(wrongList(db)[1].fails).toEqual({meaning_choice:1});
  review(db,a,Rating.Good,day(-1));review(db,a,Rating.Easy,T);
  expect(wrongSummary(db,'count',T).twoCorrectDays).toBe(1);db.close();
});
it('second practice logs only: card unchanged, no review quota/new quota usage, wrong accounting still runs',()=>{
  const db=database(); const id=card(db);
  review(db,id,Rating.Good,T,{context:'study'});const snapshot=db.prepare('SELECT * FROM cards').all();
  const count=reviewedToday(db,T),newCount=newIntroducedToday(db,T);
  review(db,id,Rating.Again,T,{context:'practice'});
  expect(db.prepare('SELECT * FROM cards').all()).toEqual(snapshot);
  expect(db.prepare('SELECT counted,context,state,due,stability FROM review_logs ORDER BY id DESC LIMIT 1').get()).toMatchObject({counted:0,context:'practice',state:(snapshot[0] as any).state,due:(snapshot[0] as any).due,stability:(snapshot[0] as any).stability});
  expect(reviewedToday(db,T)).toBe(count);expect(newIntroducedToday(db,T)).toBe(newCount);
  review(db,id,Rating.Good,T,{context:'practice'});
  expect(wrongList(db)[0].correct_days).toBe(1);
  review(db,id,Rating.Good,T,{context:'study'});expect(reviewedToday(db,T)).toBe(count+1);db.close();
});
it('first practice counts, only Good/Easy graduate on three distinct nonconsecutive dates, Hard is neutral, manual return does not add failure',()=>{
  const db=database();const id=card(db);
  for(const r of [1,2,3,4]) expect(countsTowardGraduation(r)).toBe(r>=3);
  review(db,id,Rating.Again,day(-6));review(db,id,Rating.Good,day(-5),{context:'practice'});
  expect(db.prepare('SELECT counted FROM review_logs ORDER BY id DESC LIMIT 1').get()).toEqual({counted:1});
  review(db,id,Rating.Hard,day(-3));expect(wrongList(db)[0].correct_days).toBe(1);
  review(db,id,Rating.Good,day(-2));review(db,id,Rating.Easy,T);expect(wrongList(db)).toEqual([]);
  const before=db.prepare('SELECT wrong_count FROM wrong_words').get();setWrong(db,1,true,T);
  expect(db.prepare('SELECT wrong_count FROM wrong_words').get()).toEqual(before);expect(wrongList(db)[0].correct_days).toBe(0);
  review(db,id,Rating.Good,T);review(db,id,Rating.Good,T);expect(wrongList(db)[0].correct_days).toBe(1);
  review(db,id,Rating.Again,day(1));expect(wrongList(db)[0].correct_days).toBe(0);db.close();
});
it('mixed practice prioritizes latest failed type and issues choices in practice context',()=>{
  const db=database();const id=card(db);card(db,1,'spell');card(db,1,'dictation');
  review(db,id,Rating.Again,T,{qtype:'meaning_choice'});
  const rng=seeded();let preferred=0;const types=new Set<string>();
  // Count the selection independently of the required outstanding-issue reuse.
  for(let i=0;i<400;i++) {
    db.prepare('DELETE FROM question_issues').run();
    const r=wrongPractice(db,10,T,rng).items[0]; const type=r.question?.qtype ?? r.card.mode;
    types.add(type);if(type==='meaning_choice')preferred++;
    if(r.question) expect(db.prepare('SELECT context FROM question_issues WHERE id=?').get(r.question.id)).toEqual({context:'practice'});
  }
  expect(preferred).toBeGreaterThan(270);expect(preferred).toBeLessThan(340);expect(types.size).toBe(5);db.close();
});
it('legacy spell/dictation failures are inferred alongside both choice types and flip',()=>{
  const db=database();const id=card(db),spell=card(db,1,'spell'),dictation=card(db,1,'dictation');
  review(db,id,Rating.Again,T,{qtype:'flip'});review(db,id,Rating.Again,T,{qtype:'listen_choice'});review(db,id,Rating.Again,T,{qtype:'meaning_choice'});
  review(db,spell,Rating.Again,T);review(db,dictation,Rating.Again,T);db.prepare('UPDATE review_logs SET qtype=NULL WHERE card_id IN (?,?)').run(spell,dictation);
  expect(wrongList(db)[0].fails).toEqual({flip:1,listen_choice:1,meaning_choice:1,spell:1,dictation:1});
  db.prepare("UPDATE settings SET value='0' WHERE key='choice_enabled'").run();
  for(let i=0;i<10;i++)expect(wrongPractice(db,10,T,seeded(i)).items[0].question).toBeNull();db.close();
});
