import { describe, it, expect, afterEach, vi } from 'vitest';
import {host,flush} from './p2-host';
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

  it('study keeps a rejected question visible and offers task refresh', async () => {
    const summary={day:'2026-10-20',started:true,total:1,completed:0,deferred:0,newWords:1,reviewWords:0,remaining:1,backlog:0,answers:0,correct:0,books:{new:1,unfamiliar:0,familiar:0,mastered:0}};
    globalThis.fetch=vi.fn(async(path:any)=>new Response(JSON.stringify(String(path).endsWith('/answer')?{error:'stale'}:String(path).endsWith('/next')?{kind:'card',summary,card:{issueId:'one',wordId:1,mode:'recognize',headword:'above',patterns:[],options:[{id:1,text:'上方'}],assisted:false}}:summary),{status:String(path).endsWith('/answer')?409:200})) as any;
    const ui=host('web/src/views/LearningStudyView.vue');
    try{await flush();await ui.all(n=>n.tag==='button'&&ui.text(n).includes('上方'))[0].props.onClick();await flush();
      expect(ui.text()).toContain('题目已更新，请刷新任务后继续。');
      expect(ui.all(n=>n.tag==='button'&&ui.text(n)==='刷新任务')).toHaveLength(1);
      expect(ui.text()).not.toContain('今天的任务完成了');
    }finally{ui.app.unmount();vi.unstubAllGlobals();}
  });
});
