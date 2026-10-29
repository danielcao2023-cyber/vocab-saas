import { mainHeadwords } from '../../server/src/text';
import {isMobileBuild,bundledAudio} from './offline/mobile-mode';
import {preferences} from './preferences';
import {Capacitor,registerPlugin} from '@capacitor/core';
const DeviceSpeech=registerPlugin<{speak:(args:{text:string;rate:number})=>Promise<{status:'success'|'cancelled'|'unavailable'}>;stop:()=>Promise<void>}>('DeviceSpeech');

export interface RecordingPlayback {word:string;source:'recording'|'system'|'failed';variant?:'noun'|'verb'}
export type PlaybackFailure = 'blocked' | 'failed' | 'incomplete';
export type PlaybackResult =
  | { status: 'success' | 'cancelled'; source?: 'system' }
  | { status: 'unavailable'; reason: PlaybackFailure };

// One recording at a time across study and word-detail views.
let active: { cancel: () => void } | null = null;
const PLAYBACK_TIMEOUT_MS = 15_000;

export function stopAudio(): void {
  active?.cancel();
}

/** Textbook parentheses can show a necessary example word, not an optional sound. */
export function pronunciationHeadword(headword: string): string {
  if (/^from\s*\(then\)\s*on$/i.test(headword.trim())) return 'from then on';
  return mainHeadwords(headword)[0] ?? '';
}

export function pronunciationCreditsUrl(headword?: string): string {
  const word = headword ? pronunciationHeadword(headword) : undefined;
  if(isMobileBuild())return '/offline/credits.html'+(word?'#'+encodeURIComponent(word):'');
  return '/api/pronunciation/credits' + (word ? `?word=${encodeURIComponent(word)}` : '');
}

/** Start synchronously within the click handler so the browser retains its user gesture. */
export function speak(headword: string, variant?: 'noun'|'verb'): Promise<PlaybackResult> {
  stopAudio();
  const word = pronunciationHeadword(headword);
  variant = variant ?? (word==='bow'||word==='contract'?'verb':undefined);
  if (!word || typeof Audio === 'undefined') {
    return Promise.resolve({ status: 'unavailable', reason: 'failed' });
  }
  const spoken = /^help\s+sb\.\s+to\s+one's\s+feet$/i.test(word) ? 'help someone to their feet' : word.replace(/\bsb\.(['’]s)?/gi, (_match, possessive: string | undefined) => possessive ? "someone's" : 'someone')
    .replace(/\bsth\./gi, 'something');
  return new Promise(resolve => {
    let audio: HTMLAudioElement;
    try { audio = new Audio(); }
    catch { resolve({ status: 'unavailable', reason: 'failed' }); return; }

    let settled = false, started = false, synthesizing = false;
    let cancelSpeech: (()=>void)|null=null;
    const playback = { cancel: () => finish({ status: 'cancelled' }) };
    const timeout = setTimeout(() => finish({ status: 'unavailable', reason: 'failed' }), PLAYBACK_TIMEOUT_MS);
    function finish(result: PlaybackResult): void {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cancelSpeech?.();
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
      if(synthesizing)return;
      finish(started ? { status: 'success' } : { status: 'unavailable', reason: 'failed' });
    }
    function onError(): void {
      if(settled||synthesizing)return;
      if(variant){finish({status:'unavailable',reason:'failed'});return;}
      if(/\.{2,}|…/.test(word)){finish({status:'unavailable',reason:'incomplete'});return;}
      synthesizing=true;
      if(Capacitor.isNativePlatform()){
        cancelSpeech=()=>{void DeviceSpeech.stop().catch(()=>{});};
        void DeviceSpeech.speak({text:spoken,rate:preferences.playbackRate}).then(result=>{
          if(result.status==='success')finish({status:'success',source:'system'});
          else finish(result.status==='cancelled'?{status:'cancelled'}:{status:'unavailable',reason:'failed'});
        },()=>finish({status:'unavailable',reason:'failed'}));
        return;
      }
      if(typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined'){
        finish({status:'unavailable',reason:'failed'});return;
      }
      const utterance=new SpeechSynthesisUtterance(spoken);
      const voice=speechSynthesis.getVoices().find(v=>/^en[-_]/i.test(v.lang)&&v.localService)
        ??speechSynthesis.getVoices().find(v=>/^en[-_]/i.test(v.lang));
      utterance.lang=voice?.lang??'en-US';if(voice)utterance.voice=voice;
      utterance.rate=preferences.playbackRate;
      utterance.onend=()=>finish({status:'success',source:'system'});
      utterance.onerror=()=>finish({status:'unavailable',reason:'failed'});
      cancelSpeech=()=>{utterance.onend=null;utterance.onerror=null;speechSynthesis.cancel();};
      try{speechSynthesis.speak(utterance);}catch{finish({status:'unavailable',reason:'failed'});}
    }
    function onRejected(error: unknown): void {
      if(settled||synthesizing)return;
      const blocked = typeof error === 'object' && error !== null && 'name' in error && error.name === 'NotAllowedError';
      if(!blocked&&typeof error==='object'&&error!==null&&'name' in error&&error.name==='NotSupportedError'){onError();return;}
      finish({ status: 'unavailable', reason: blocked ? 'blocked' : 'failed' });
    }

    active = playback;
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    try {
      audio.preload = 'auto';
      if(isMobileBuild()&&!bundledAudio(word,variant)){onError();return;}
      audio.src = isMobileBuild()?bundledAudio(word,variant)!:`/api/pronunciation/audio?word=${encodeURIComponent(word)}${variant?`&variant=${encodeURIComponent(variant)}`:''}`;
      audio.defaultPlaybackRate = preferences.playbackRate;
      audio.playbackRate = preferences.playbackRate;
      // A fulfilled play() only means playback started, not that the recording completed.
      Promise.resolve(audio.play()).then(() => { started = true; }, onRejected);
    } catch (error) { onRejected(error); }
  });
}
