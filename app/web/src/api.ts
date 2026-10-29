import { ClientError, OfflineError } from './pending';
export { ClientError, OfflineError };
export { speak, stopAudio, pronunciationCreditsUrl } from './audio';
export type { PlaybackFailure, PlaybackResult } from './audio';
export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    const supportsAudio=path.startsWith('/api/learning/')||/^\/api\/pronunciation\?word=(?:bow|contract)(?:&|$)/.test(path);
    const headers:Record<string,string>={...(supportsAudio?{'x-audio-variants':'1'}:{}),...(body===undefined?{}:{'content-type':'application/json'})};
    r = await fetch(path, body === undefined ? (supportsAudio?{headers}:undefined) : { method: 'POST', headers, body: JSON.stringify(body) });
  } catch { throw new OfflineError('offline'); }
  if (r.status >= 500 || r.status === 0) throw new OfflineError(String(r.status));
  let j: any = null;
  try { j = await r.json(); } catch { /* 非 JSON */ }
  if (r.status >= 400) throw new ClientError(r.status, j?.error ?? String(r.status));
  return j as T;
}
