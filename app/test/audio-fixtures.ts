import { vi } from 'vitest';

/** A controllable media element: play() starting is distinct from ended/error. */
export class MockAudio extends EventTarget {
  static instances: MockAudio[] = [];
  static start: (audio: MockAudio) => Promise<void> = async audio => { audio.emit('playing'); };
  private source = '';
  get src(){return this.source;}
  set src(value:string){this.source=value;this.playbackRate=this.defaultPlaybackRate;}
  preload = '';
  defaultPlaybackRate = 1;
  playbackRate = 1;
  pause = vi.fn();
  load = vi.fn();
  play = vi.fn(() => MockAudio.start(this));
  removeAttribute = vi.fn((name: string) => { if (name === 'src') this.src = ''; });
  constructor() { super(); MockAudio.instances.push(this); }
  emit(event: string) { this.dispatchEvent(new Event(event)); }
}

export function mockAudio() {
  MockAudio.instances = [];
  MockAudio.start = async audio => { audio.emit('playing'); };
  vi.stubGlobal('Audio', MockAudio);
}
