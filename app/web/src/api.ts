import { OfflineError } from './pending';
export { OfflineError };
export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(path, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch { throw new OfflineError('offline'); }
  if (r.status >= 500 || r.status === 0) throw new OfflineError(String(r.status));
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? String(r.status));
  return j as T;
}
export function speak(word: string): boolean {
  const w = word.replace(/\(.*?\)/g, '').trim();
  if (!('speechSynthesis' in window)) return false;
  const u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; u.rate = 0.9;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
  return true;
}
