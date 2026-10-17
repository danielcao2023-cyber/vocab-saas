import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { vueSources } from './vue-sources.ts';
import { COPY, isRepeatCard } from '../web/src/copy.ts';
import { Rating, State } from 'ts-fsrs';
import { openDb } from '../server/src/db.ts';
import { nextCard, review } from '../server/src/study.ts';

describe('relearn copy', () => {
  it('wording matches v2/内容.md', () => {
    const doc = fs.readFileSync('../v2/内容.md', 'utf8');
    expect(doc).toContain(`“${COPY.repeatCard}”`);
    expect(doc).toContain(`“${COPY.homeRelearnNote}”`);
  });
  it('flags only cards re-shown in learning/relearning', () => {
    expect(isRepeatCard({ state: State.New, reps: 0 })).toBe(false);
    expect(isRepeatCard({ state: State.Review, reps: 3 })).toBe(false);
    expect(isRepeatCard({ state: State.Learning, reps: 1 })).toBe(true);
    expect(isRepeatCard({ state: State.Relearning, reps: 5 })).toBe(true);
  });
  it('a card answered Again comes back flagged', () => {
    const db = openDb(':memory:'); db.prepare("INSERT INTO words(headword,source) VALUES ('x','t')").run();
    const t = new Date('2026-10-17T01:00:00Z');
    const c = nextCard(db, t)!; expect(isRepeatCard(c as any)).toBe(false);
    review(db, c.id as number, Rating.Again, t);
    const again = nextCard(db, new Date(t.getTime() + 2 * 60_000))!;
    expect(again.id).toBe(c.id); expect(isRepeatCard(again as any)).toBe(true);
  });
  it('App.vue renders both lines (no popup)', () => {
    // v3 splits App.vue into views/components: verify rendered copy across all Vue sources.
    const app = vueSources().map(s => s.text).join('\n');
    expect(app).toContain('{{ COPY.repeatCard }}'); expect(app).toContain('{{ COPY.homeRelearnNote }}');
    expect(app).not.toMatch(/alert\(|confirm\(/);
  });
});
