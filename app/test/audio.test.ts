import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { speak, stopAudio } from '../web/src/audio.ts';
import { mockAudio, MockAudio } from './audio-fixtures.ts';
import {applyPreferences} from '../web/src/preferences';
import {DEFAULT_PREFERENCES} from '../shared/preferences';

beforeEach(mockAudio);
afterEach(() => { stopAudio(); applyPreferences(DEFAULT_PREFERENCES); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('uses the saved recording speed without delaying the user gesture',async()=>{
 applyPreferences({...DEFAULT_PREFERENCES,playbackRate:0.75});const result=speak('above');const audio=MockAudio.instances[0];expect(audio.playbackRate).toBe(0.75);expect(audio.defaultPlaybackRate).toBe(0.75);expect(audio.play).toHaveBeenCalledOnce();audio.emit('ended');await expect(result).resolves.toEqual({status:'success'});
});

it('starts the same-origin recording synchronously and preserves the exact case', async () => {
  const result = speak('US / us');
  const audio = MockAudio.instances[0];
  expect(audio.src).toBe('/api/pronunciation/audio?word=US');
  expect(audio.play).toHaveBeenCalledOnce();
  audio.emit('ended');
  await expect(result).resolves.toEqual({ status: 'success' });
});

it('does not report success merely because play() fulfilled, and catches a later media failure', async () => {
  const settled = vi.fn();
  const result = speak('receive');
  result.then(settled);
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  MockAudio.instances[0].emit('error');
  await expect(result).resolves.toEqual({ status: 'unavailable', reason: 'failed' });
});

it.each([
  ['NotAllowedError', 'blocked'],
  ['NotSupportedError', 'failed'],
  ['AbortError', 'failed'],
])('handles rejected play() (%s) without an unhandled rejection', async (name, reason) => {
  MockAudio.start = () => Promise.reject(Object.assign(new Error('Cannot play'), { name }));
  await expect(speak('accept')).resolves.toEqual({ status: 'unavailable', reason });
  expect(MockAudio.instances[0].pause).toHaveBeenCalledOnce();
});

it('a second click cancels the old recording, detaches its source and ignores its late failure', async () => {
  let rejectOld!: (error: Error) => void;
  MockAudio.start = () => new Promise((_, reject) => { rejectOld = reject; });
  const old = speak('receive');
  const oldAudio = MockAudio.instances[0];
  MockAudio.start = async audio => { audio.emit('playing'); };
  const latest = speak('accept');
  await expect(old).resolves.toEqual({ status: 'cancelled' });
  expect(oldAudio.pause).toHaveBeenCalledOnce();
  expect(oldAudio.src).toBe('');
  expect(oldAudio.load).toHaveBeenCalledOnce();
  rejectOld(Object.assign(new Error('aborted'), { name: 'AbortError' }));
  oldAudio.emit('error');
  oldAudio.emit('ended');
  MockAudio.instances[1].emit('ended');
  await expect(latest).resolves.toEqual({ status: 'success' });
});

it('cancels a pending load explicitly and can be stopped more than once', async () => {
  MockAudio.start = () => new Promise(() => {});
  const result = speak('receive');
  stopAudio(); stopAudio();
  await expect(result).resolves.toEqual({ status: 'cancelled' });
  expect(MockAudio.instances[0].pause).toHaveBeenCalledOnce();
});

it('fails and releases a stalled recording after a bounded wait', async () => {
  vi.useFakeTimers();
  MockAudio.start = () => new Promise(() => {});
  const result = speak('receive');
  await vi.advanceTimersByTimeAsync(15_000);
  await expect(result).resolves.toEqual({ status: 'unavailable', reason: 'failed' });
  const audio = MockAudio.instances[0];
  expect(audio.pause).toHaveBeenCalledOnce();
  expect(audio.src).toBe('');
});

it('does not treat an ended event before playback started as success', async () => {
  MockAudio.start = () => new Promise(() => {});
  const result = speak('receive');
  MockAudio.instances[0].emit('ended');
  await expect(result).resolves.toEqual({ status: 'unavailable', reason: 'failed' });
});

it('fails cleanly for an empty word or missing media support without trying speech synthesis', async () => {
  const synth = { speak: vi.fn() };
  vi.stubGlobal('speechSynthesis', synth);
  await expect(speak(' (AmE) ')).resolves.toEqual({ status: 'unavailable', reason: 'failed' });
  vi.stubGlobal('Audio', undefined);
  await expect(speak('receive')).resolves.toEqual({ status: 'unavailable', reason: 'failed' });
  expect(MockAudio.instances).toHaveLength(0);
  expect(synth.speak).not.toHaveBeenCalled();
});

it('falls back to an English device voice for an unbundled word and cancels it on navigation', async()=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined;
 const synth={getVoices:()=>[{lang:'en-US',localService:true}],speak:vi.fn((u:Utterance)=>{utterance=u;}),cancel:vi.fn()};
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',synth);
 applyPreferences({...DEFAULT_PREFERENCES,playbackRate:0.75});
 const result=speak('aberration');MockAudio.instances[0].emit('error');
 expect(utterance?.text).toBe('aberration');expect(utterance?.lang).toBe('en-US');expect(utterance?.rate).toBe(0.75);
 utterance!.onend!();await expect(result).resolves.toEqual({status:'success',source:'system'});
 const cancelled=speak('another');MockAudio.instances[1].emit('error');stopAudio();
 await expect(cancelled).resolves.toEqual({status:'cancelled'});expect(synth.cancel).toHaveBeenCalled();
});
it('ignores the companion media rejection after the error event starts a device voice',async()=>{
 class Utterance {text:string;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined,rejectMedia!:(error:Error)=>void;
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:Utterance)=>{utterance=u;},cancel:vi.fn()});
 MockAudio.start=()=>new Promise((_,reject)=>rejectMedia=reject);
 const result=speak('aberration'),settled=vi.fn();result.then(settled);MockAudio.instances[0].emit('error');rejectMedia(Object.assign(Error('no source'),{name:'NotSupportedError'}));await Promise.resolve();await Promise.resolve();expect(settled).not.toHaveBeenCalled();utterance!.onend!();await expect(result).resolves.toEqual({status:'success',source:'system'});
});

it('speaks the complete example for the abbreviated textbook phrase',async()=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined;
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);
 vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:Utterance)=>{utterance=u;},cancel:vi.fn()});
 const result=speak('from (then) on');
 expect(MockAudio.instances[0].src).toBe('/api/pronunciation/audio?word=from%20then%20on');
 MockAudio.instances[0].emit('error');
 expect(utterance?.text).toBe('from then on');
 utterance!.onend!();await expect(result).resolves.toEqual({status:'success',source:'system'});
});

it.each([
 ['sign up for sth.','sign up for something'],
 ['remind sb. of sth.','remind someone of something'],
 ["take sb.'s breath away","take someone's breath away"],
])('speaks textbook placeholder in %s as natural English',async(headword,expected)=>{
 class Utterance {text:string;lang='';rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 let utterance:Utterance|undefined;
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);
 vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:Utterance)=>{utterance=u;},cancel:vi.fn()});
 const result=speak(headword);
 expect(MockAudio.instances[0].src).toBe('/api/pronunciation/audio?word='+encodeURIComponent(headword));
 MockAudio.instances[0].emit('error');
 expect(utterance?.text).toBe(expected);
 utterance!.onend!();await expect(result).resolves.toEqual({status:'success',source:'system'});
});

it('plays a selected part-of-speech recording without falling back to speech synthesis',async()=>{
 const synth=vi.fn();vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:synth,cancel:vi.fn()});
 const first=speak('estimate','noun');const audio=MockAudio.instances[0];
 expect(audio.src).toBe('/api/pronunciation/audio?word=estimate&variant=noun');
 audio.emit('error');await expect(first).resolves.toEqual({status:'unavailable',reason:'failed'});expect(synth).not.toHaveBeenCalled();
 const second=speak('estimate','verb');expect(MockAudio.instances[1].src).toBe('/api/pronunciation/audio?word=estimate&variant=verb');MockAudio.instances[1].emit('ended');await expect(second).resolves.toEqual({status:'success'});
});
