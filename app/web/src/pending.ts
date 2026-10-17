/** 断线时的答案补存：每个答案一个幂等键；重连时自动补存一次，失败后允许手动重试（同一键） */
export class OfflineError extends Error {}
export type Poster = (path: string, body: Record<string, unknown>) => Promise<any>;

export function newAnswerId(): string {
  const c = (globalThis as any).crypto;
  return c?.randomUUID ? c.randomUUID() : `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class PendingSubmitter {
  pending: { path: string; body: Record<string, unknown> } | null = null;
  autoRetried = false;
  constructor(private post: Poster) {}

  get failed() { return this.pending !== null; }

  /** 首次提交；离线时挂起并返回 null（卡片不前进） */
  async submit(path: string, body: Record<string, unknown>) {
    const b = { ...body, answerId: newAnswerId() };
    this.autoRetried = false;
    try { const r = await this.post(path, b); this.pending = null; this.autoRetried = false; return r; }
    catch (e) {
      if (!(e instanceof OfflineError)) throw e;
      this.pending = { path, body: b }; return null;
    }
  }

  /** 重连后自动补存，只自动一次 */
  async onReconnect() {
    if (!this.pending || this.autoRetried) return null;
    this.autoRetried = true;
    return this.retry();
  }

  /** 手动重试（同一幂等键） */
  async retry(override?: Record<string, unknown>) {
    if (!this.pending) return null;
    const { path, body } = this.pending;
    try { const r = await this.post(path, { ...body, ...override, answerId: body.answerId }); this.pending = null; this.autoRetried = false; return r; }
    catch (e) { if (!(e instanceof OfflineError)) throw e; return null; }
  }
}
