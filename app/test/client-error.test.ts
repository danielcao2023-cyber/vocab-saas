import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { api } from '../web/src/api.ts';
import { ClientError, OfflineError, PendingSubmitter } from '../web/src/pending.ts';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
const respond = (status: number, body: unknown) => { globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(body), { status })) as any; };

describe('4xx vs offline', () => {
  it('api: 4xx -> ClientError; 5xx/network -> OfflineError', async () => {
    respond(400, { ok: false, error: 'not a spelling card' });
    await expect(api('/api/check', {})).rejects.toBeInstanceOf(ClientError);
    respond(404, 'x');
    await expect(api('/api/x')).rejects.toMatchObject({ status: 404 });
    respond(503, {});
    await expect(api('/api/check', {})).rejects.toBeInstanceOf(OfflineError);
    globalThis.fetch = vi.fn(async () => { throw new TypeError('Failed to fetch'); }) as any;
    await expect(api('/api/check', {})).rejects.toBeInstanceOf(OfflineError);
  });

  it('submitter: 4xx is not queued for retry', async () => {
    let calls = 0;
    const p = new PendingSubmitter(async () => { calls++; throw new ClientError(400, 'not a spelling card'); });
    await expect(p.submit('/api/check', { cardId: 1 })).rejects.toBeInstanceOf(ClientError);
    expect(p.failed).toBe(false);
    expect(await p.onReconnect()).toBeNull();
    expect(calls).toBe(1);
  });

  it('submitter: 4xx on a retry clears the pending answer', async () => {
    let mode: 'down' | '400' = 'down';
    const p = new PendingSubmitter(async () => { if (mode === 'down') throw new OfflineError('x'); throw new ClientError(400, 'gone'); });
    await p.submit('/api/review', { cardId: 1, rating: 3 });
    expect(p.failed).toBe(true);
    mode = '400';
    await expect(p.onReconnect()).rejects.toBeInstanceOf(ClientError);
    expect(p.failed).toBe(false);
  });

  it('App shows stale message with reload button', () => {
    const app = fs.readFileSync('web/src/App.vue', 'utf8');
    expect(app).toContain('{{ COPY.staleCard }} <button @click="reloadPage">{{ COPY.refresh }}</button>');
    expect(app).toContain('location.reload()');
  });
});
