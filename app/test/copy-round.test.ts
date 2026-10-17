// v3 第一期 copy round：内容制作文案审查（v3/phase1-copy-review.md）13 条 + 第 15 条口径
import { it, expect } from 'vitest';
import { Rating } from 'ts-fsrs';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { COPY } from '../web/src/copy.ts';
import HomeView from '../web/src/views/HomeView.vue';
import WrongView from '../web/src/views/WrongView.vue';
import DoneView from '../web/src/views/DoneView.vue';
import ProgressPanel from '../web/src/components/ProgressPanel.vue';
import { review, setWrong, wrongSummary } from '../server/src/study.ts';
import { curriculumProgress, makeup, streak } from '../server/src/stats.ts';
import { vueSources } from './vue-sources.ts';
import { card, database, day, T } from './v3-helpers.ts';
const render = (c: any, props: any) => renderToString(createSSRApp({ render: () => h(c, props) }));

it('all 13 suggested strings are applied', () => {
  expect(COPY.wrongRule).toBe('在 3 个不同的日子答对，就会自动移出错词本。');
  expect(COPY.spellWrong).toBe('拼错了');
  expect(COPY.expectedChoice('B', 'word', '意思')).toBe('正确答案是 B：word 意思。已加入错词本。');
  expect(COPY.makeupHint).toBe('完成今天的任务后，就能补签没打卡的日子。');
  expect(COPY.makeupReady).toBe('点一下没打卡的日子就能补签。');
  expect(COPY.dictationPrompt).toBe('听发音，拼出单词');
  expect(COPY.roundDone).toBe('这一轮的词做完了。');
  expect(COPY.comparison(3, 5, 80, 76)).toBe('本周新掌握 3 个（上周 5 个）· 正确率 80%（上周 76%）');
  expect(COPY.backToday).toBe('回到今日');
  expect(COPY.wrongPracticeNote).toBe('练错词会先出你错过的题型。同一个词一天只算第一次练。');
  expect(COPY.nearOut(2)).toBe('其中 2 个已经对了 2 天，再对 1 天就移出。');
  expect(COPY.coreNote).toBe('初中新学'); expect(COPY.level2Note).toBe('小学学过');
  // 保留项没动
  expect(COPY.wrongEmptyNote).toBe('答错或点了「忘了」的词会自动放进来，在 3 个不同的日子答对就会移出。');
  expect(COPY.almost).toBe('差一点'); expect(COPY.makeupNoneEligible).toBe('现在没有可以补签的日子。'); expect(COPY.makeupUsedUp).toBe('这个月的补签次数已用完。');
  const src = vueSources().map(s => s.text).join('\n');
  expect(src).not.toContain('回首页'); expect(src).not.toContain('本周已练对');
});

it('#12 home shows this week and last week side by side, never a difference', async () => {
  const db = database(3);
  const today = { day: '2026-10-17', review: 0, new: 0, minutes: 0, completed: true, streak: 1, stats: { answers: 1, accuracy: 1 }, masteredNew: 0, tomorrowReview: 0,
    comparison: { thisWeek: { masteredNew: 2, accuracy: 0.8 }, previousWeek: { masteredNew: 5, accuracy: 0.755 } } };
  const html = await render(HomeView, { today, curriculum: curriculumProgress(db), streak: streak(db, T), wrong: { items: [], total: 0, twoCorrectDays: 0 }, empty: false });
  expect(html).toContain('本周新掌握 2 个（上周 5 个）· 正确率 80%（上周 76%）');
  expect(html).not.toContain('少掌握'); expect(html).not.toContain('和上周的自己比');
  db.close();
});

it('#15 N = words still in the book with exactly 2 distinct Good/Easy days; Hard neutral, Again resets, any week', () => {
  const db = database(); const a = card(db, 1), b = card(db, 2), c = card(db, 3), d = card(db, 4);
  for (const id of [a, b, c, d]) review(db, id, Rating.Again, day(-20));
  // a: two distinct days, 10+ days ago (last week's dates still count)
  review(db, a, Rating.Good, day(-12)); review(db, a, Rating.Easy, day(-11));
  // b: Good twice on the same day + Hard on another day → 1 day
  review(db, b, Rating.Good, day(-2)); review(db, b, Rating.Good, day(-2)); review(db, b, Rating.Hard, day(-1));
  // c: two days, then Again resets → 0; then one more Good → 1
  review(db, c, Rating.Good, day(-4)); review(db, c, Rating.Good, day(-3)); review(db, c, Rating.Again, day(-2)); review(db, c, Rating.Good, day(-1));
  // d: three days → graduated, not counted
  review(db, d, Rating.Good, day(-3)); review(db, d, Rating.Good, day(-2)); review(db, d, Rating.Good, day(-1));
  const s = wrongSummary(db, 'count', T);
  expect(s.total).toBe(3); expect(s.twoCorrectDays).toBe(1);
  // Hard between two Good days does not reset
  review(db, b, Rating.Hard, T); review(db, b, Rating.Good, T); expect(wrongSummary(db, 'count', T).twoCorrectDays).toBe(2);
  // manual put-back resets progress
  setWrong(db, 1, true, T); expect(wrongSummary(db, 'count', T).twoCorrectDays).toBe(1);
  db.close();
});

it('#13/#15/#18 render in views', async () => {
  const wrong = { items: [{ word_id: 1, headword: 'x', phonetic: null, meaning_zh: 'n. 某', wrong_count: 1, last_wrong_at: T.toISOString(), correct_days: 2, fails: {} }], total: 1, twoCorrectDays: 1 };
  const w = await render(WrongView, { wrong, sort: 'count', today: '2026-10-17', busy: false });
  expect(w).toContain('其中 1 个已经对了 2 天，再对 1 天就移出。在 3 个不同的日子答对，就会自动移出错词本。');
  const w0 = await render(WrongView, { wrong: { ...wrong, twoCorrectDays: 0 }, sort: 'count', today: '2026-10-17', busy: false });
  expect(w0).not.toContain('其中 0 个');
  const e = await render(WrongView, { wrong: { items: [], total: 0, twoCorrectDays: 0 }, sort: 'count', today: '2026-10-17', busy: false });
  expect(e).toContain('回到今日');
  const today = { day: '2026-10-17', review: 0, new: 0, minutes: 0, completed: true, streak: 1, stats: { answers: 1, accuracy: 1 }, masteredNew: 0, tomorrowReview: 0, comparison: null };
  expect(await render(DoneView, { today, session: { done: 1, correct: 1 } })).toContain('回到今日');
  const db = database(3);
  const p = await render(ProgressPanel, { curriculum: curriculumProgress(db) }); expect(p).toContain('初中新学'); expect(p).toContain('小学学过');
  db.close();
});

it('#16 server reason for too-old days', () => {
  const db = database(); const id = card(db);
  review(db, id, Rating.Good, day(-20));
  expect(() => makeup(db, '2026-09-30', T)).toThrow('这一天太久了，不能补签');
  db.close();
});
