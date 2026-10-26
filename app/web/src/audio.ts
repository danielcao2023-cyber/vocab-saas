import { mainHeadwords } from '../../server/src/text';
import {isMobileBuild,bundledAudio} from './offline/mobile-mode';
import {preferences} from './preferences';

export type PlaybackFailure = 'blocked' | 'failed';
export type PlaybackResult =
  | { status: 'success' | 'cancelled' }
  | { status: 'unavailable'; reason: PlaybackFailure };

// One recording at a time across study and word-detail views.
let active: { cancel: () => void } | null = null;
const PLAYBACK_TIMEOUT_MS = 15_000;

export function stopAudio(): void {
  active?.cancel();
}

export function pronunciationCreditsUrl(headword?: string): string {
  const word = headword ? mainHeadwords(headword)[0] : undefined;
  if(isMobileBuild())return '/offline/credits.html'+(word?'#'+encodeURIComponent(word):'');
  return '/api/pronunciation/credits' + (word ? `?word=${encodeURIComponent(word)}` : '');
}

/** Start synchronously within the click handler so the browser retains its user gesture. */
export function speak(headword: string): Promise<PlaybackResult> {
  stopAudio();
  const word = mainHeadwords(headword)[0] ?? '';
  if (!word || typeof Audio === 'undefined') {
    return Promise.resolve({ status: 'unavailable', reason: 'failed' });
  }
  return new Promise(resolve => {
    let audio: HTMLAudioElement;
    try { audio = new Audio(); }
    catch { resolve({ status: 'unavailable', reason: 'failed' }); return; }

    let settled = false, started = false;
    const playback = { cancel: () => finish({ status: 'cancelled' }) };
    const timeout = setTimeout(() => finish({ status: 'unavailable', reason: 'failed' }), PLAYBACK_TIMEOUT_MS);
    function finish(result: PlaybackResult): void {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (active === playback) active = null;
      // Detach the source as well as pausing: a pending network load must not start later.
      try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch { /* Already detached. */ }
      resolve(result);
    }
    function onPlaying(): void { started = true; }
    function onEnded(): void {
      finish(started ? { status: 'success' } : { status: 'unavailable', reason: 'failed' });
    }
    function onError(): void { finish({ status: 'unavailable', reason: 'failed' }); }
    function onRejected(error: unknown): void {
      const blocked = typeof error === 'object' && error !== null && 'name' in error && error.name === 'NotAllowedError';
      finish({ status: 'unavailable', reason: blocked ? 'blocked' : 'failed' });
    }

    active = playback;
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    try {
      audio.preload = 'auto';
      if(isMobileBuild()&&!bundledAudio(word)){finish({status:'unavailable',reason:'failed'});return;}
      audio.src = isMobileBuild()?bundledAudio(word)!:`/api/pronunciation/audio?word=${encodeURIComponent(word)}`;
      audio.defaultPlaybackRate = preferences.playbackRate;
      audio.playbackRate = preferences.playbackRate;
      // A fulfilled play() only means playback started, not that the recording completed.
      Promise.resolve(audio.play()).then(() => { started = true; }, onRejected);
    } catch (error) { onRejected(error); }
  });
}
