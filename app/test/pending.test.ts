import { describe, it, expect } from 'vitest';
import { OfflineError, PendingSubmitter } from '../web/src/pending.ts';

function fakeServer() {
  let up = true; const applied = new Map<string, unknown>(); const calls: any[] = [];
  const post = async (_p: string, body: any) => {
    calls.push(body);
    if (!up) throw new OfflineError('down');
    if (!applied.has(body.answerId)) applied.set(body.answerId, body.rating);
    return { ok: true };
  };
  return { post, set up(v: boolean) { up = v; }, applied, calls };
}

describe('offline rating', () => {
  it('keeps answer when down, auto-resubmits once on reconnect, no double apply', async () => {
    const s = fakeServer(); const p = new PendingSubmitter(s.post);
    s.up = false;
    expect(await p.submit('/api/review', { cardId: 1, rating: 3 })).toBeNull();
    expect(p.failed).toBe(true);
    s.up = true;
    expect(await p.onReconnect()).toEqual({ ok: true });
    expect(p.failed).toBe(false);
    expect(await p.onReconnect()).toBeNull(); // 没有挂起的就不再提交
    expect(s.applied.size).toBe(1);
    expect(new Set(s.calls.map((c) => c.answerId)).size).toBe(1);
  });

  it('auto retry only once; then manual retry with same key', async () => {
    const s = fakeServer(); const p = new PendingSubmitter(s.post);
    s.up = false;
    await p.submit('/api/review', { cardId: 1, rating: 1 });
    expect(await p.onReconnect()).toBeNull(); // 自动补存失败
    const before = s.calls.length;
    expect(await p.onReconnect()).toBeNull(); // 不再自动
    expect(s.calls.length).toBe(before);
    s.up = true;
    expect(await p.retry({ rating: 2 })).toEqual({ ok: true });
    expect(new Set(s.calls.map((c) => c.answerId)).size).toBe(1);
    expect(s.applied.size).toBe(1);
  });

  it('server already got it (response lost) -> retry is idempotent', async () => {
    const applied = new Set<string>(); let n = 0;
    const post = async (_p: string, b: any) => { n++; applied.add(b.answerId); if (n === 1) throw new OfflineError('resp lost'); return { ok: true }; };
    const p = new PendingSubmitter(post);
    await p.submit('/api/review', { cardId: 1, rating: 3 });
    await p.onReconnect();
    expect(applied.size).toBe(1);
  });
});

describe('new answer gets new key', () => {
  it('a later answer is not deduped against an abandoned pending one', async () => {
    const ids: string[] = []; let up = false;
    const p = new PendingSubmitter(async (_p, b: any) => { ids.push(b.answerId); if (!up) throw new OfflineError('x'); return { ok: true }; });
    await p.submit('/api/review', { cardId: 1, rating: 3 });
    up = true; await p.submit('/api/review', { cardId: 2, rating: 3 });
    expect(ids[0]).not.toBe(ids[1]);
  });
});
