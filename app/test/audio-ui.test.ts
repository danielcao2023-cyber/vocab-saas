import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { COPY } from '../web/src/copy.ts';
import type { Card, Turn, WordDetail } from '../web/src/types.ts';
import { mockAudio, MockAudio } from './audio-fixtures.ts';
import { flush, host } from './p2-host.ts';

const card: Card = { id: 1, word_id: 1, mode: 'recognize', headword: 'receive', phonetic: null, meaning_zh: 'v. 收到', meaning_source: 'manual', meaning_flag: null, is_sample: 0, state: 0, reps: 0, level: '三级' };
const listening: Turn = { card, question: { id: 1, qtype: 'listen_choice', options: [{ wordId: 1, text: '收到' }, { wordId: 2, text: '接受' }] } };
const wordDetail = (id = 1, headword = 'receive'): WordDetail => ({
  word: { ...card, id, headword, pos: 'v.', source: 'kb2022' }, status: '新词',
  statusDetail: { recognize: null, spell: null, dictation: null }, wrong: null,
  content: { status: 'pending', blocks: [] },
});

beforeEach(() => {
  mockAudio();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"status":"missing"}', { status: 200 })));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('StudyView explains blocked autoplay and a manual click retries the real recording', async () => {
  MockAudio.start = () => Promise.reject(Object.assign(new Error('User gesture required'), { name: 'NotAllowedError' }));
  const ui = host('web/src/views/StudyView.vue', { prefer: 'review', practice: [listening], estimate: 1 });
  try {
    await flush();
    expect(ui.text()).toContain(COPY.audioBlocked);
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    expect(ui.text()).not.toContain('receive');
    const credits = ui.all(n => n.tag === 'a' && ui.text(n) === COPY.audioCredits)[0];
    expect(credits.props.href).toBe('/api/pronunciation/credits');
    MockAudio.start = async audio => { audio.emit('playing'); };
    ui.all(n => n.tag === 'button' && ui.text(n) === COPY.audioRetry)[0].props.onClick();
    await flush();
    expect(MockAudio.instances).toHaveLength(2);
    expect(MockAudio.instances[1].src).toBe('/api/pronunciation/audio?word=receive');
    expect(ui.text()).not.toContain(COPY.audioBlocked);
    MockAudio.instances[1].emit('ended');
    await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
  } finally { ui.app.unmount(); }
});

it('StudyView cancels playback when advancing, and late failures cannot overwrite the next card', async () => {
  let rejectOld!: (error: Error) => void;
  MockAudio.start = () => new Promise((_, reject) => { rejectOld = reject; });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"status":"pending","blocks":[]}', { status: 200 })));
  const next = { ...card, id: 2, word_id: 2, headword: 'accept' };
  const ui = host('web/src/views/StudyView.vue', { prefer: 'review', practice: [{ card, question: null }, { card: next, question: null }], estimate: 2 });
  try {
    await flush(); ui.key('r'); await flush();
    const oldAudio = MockAudio.instances[0];
    expect(oldAudio.src).toContain('receive');
    ui.key('Enter'); await flush(); ui.key('3'); await flush();
    expect(ui.text()).toContain('accept');
    expect(oldAudio.pause).toHaveBeenCalledOnce();
    expect(oldAudio.src).toBe('');
    rejectOld(new Error('late network error')); oldAudio.emit('error');
    await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    expect(ui.text()).not.toContain(COPY.audioBlocked);
  } finally { ui.app.unmount(); }
});

it('StudyView cancels playback on pause and unmount without showing an audio failure', async () => {
  const cancel = vi.fn();
  const ui = host('web/src/views/StudyView.vue', { prefer: 'review', practice: [listening], estimate: 1, onCancel: cancel });
  await flush();
  const audio = MockAudio.instances[0];
  ui.key('Escape'); await flush();
  expect(cancel).toHaveBeenCalledOnce();
  expect(audio.pause).toHaveBeenCalledOnce();
  expect(ui.text()).not.toContain(COPY.audioUnavailable);
  ui.app.unmount();
  expect(audio.pause).toHaveBeenCalledOnce();
});

it('WordView shows an honest unavailable message after media failure and clears it when retrying', async () => {
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    await flush();
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    MockAudio.instances[0].emit('error'); await flush();
    expect(ui.text()).toContain(COPY.audioUnavailable);
    expect(ui.text()).not.toContain('检查耳机或音量');
    ui.all(n => n.tag === 'button' && ui.text(n) === COPY.audioRetry)[0].props.onClick();
    await flush();
    expect(MockAudio.instances).toHaveLength(2);
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    MockAudio.instances[1].emit('ended'); await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
  } finally { ui.app.unmount(); }
});

it('WordView cancels on word changes and unmount, ignores old failures and links the exact main headword credits', async () => {
  let rejectOld!: (error: Error) => void;
  MockAudio.start = () => new Promise((_, reject) => { rejectOld = reject; });
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(wordDetail(2, 'US / us')), { status: 200 })));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    await flush();
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    const oldAudio = MockAudio.instances[0];
    ui.updateProps({ wordId: 2 }); await flush();
    expect(oldAudio.pause).toHaveBeenCalledOnce();
    expect(oldAudio.src).toBe('');
    expect(ui.text()).toContain('US / us');
    expect(ui.all(n => n.tag === 'a' && ui.text(n) === COPY.audioCredits)[0].props.href).toBe('/api/pronunciation/credits?word=US');
    rejectOld(new Error('late error')); oldAudio.emit('error'); await flush();
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    MockAudio.start = async audio => { audio.emit('playing'); };
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
  } finally { ui.app.unmount(); }
  expect(MockAudio.instances[1].pause).toHaveBeenCalledOnce();
  expect(MockAudio.instances[1].src).toBe('');
});

it('WordView loads the optional pronunciation note independently while the word and playback remain usable', async () => {
  let resolveMetadata!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { resolveMetadata = resolve; })));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail(1, 'live') });
  try {
    expect(ui.text()).toContain('live');
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    expect(MockAudio.instances[0].src).toBe('/api/pronunciation/audio?word=live');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/pronunciation?word=live', undefined);
    resolveMetadata(new Response(JSON.stringify({ status: 'ready', pronunciationNote: '动词 live /lɪv/（生活、居住）。' })));
    await flush();
    expect(ui.all(n => n.props['aria-label'] === '发音说明').map(n => ui.text(n))).toEqual(['动词 live /lɪv/（生活、居住）。']);
    expect(MockAudio.instances[0].pause).not.toHaveBeenCalled();
  } finally { ui.app.unmount(); }
});

it('WordView keeps the newest pronunciation note when old metadata arrives after a word change', async () => {
  let resolveOld!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url === '/api/pronunciation?word=receive') return new Promise<Response>(resolve => { resolveOld = resolve; });
    if (url === '/api/pronunciation?word=US') return new Response('{"status":"ready","pronunciationNote":"缩写 US 的美式录音。"}');
    return new Response(JSON.stringify(wordDetail(2, 'US / us')));
  }));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    ui.updateProps({ wordId: 2 }); await flush();
    expect(ui.text()).toContain('缩写 US 的美式录音。');
    resolveOld(new Response('{"status":"ready","pronunciationNote":"旧单词的录音说明。"}')); await flush();
    expect(ui.text()).not.toContain('旧单词的录音说明。');
    expect(ui.text()).toContain('缩写 US 的美式录音。');
  } finally { ui.app.unmount(); }
});

it('WordView metadata failure does not become a word-loading or playback error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network unavailable'); }));
  const ui = host('web/src/views/WordView.vue', { wordId: 1, initial: wordDetail() });
  try {
    await flush();
    expect(ui.text()).toContain('receive');
    expect(ui.all(n => n.props['aria-label'] === '发音说明')).toHaveLength(0);
    expect(ui.text()).not.toContain(COPY.retry);
    expect(ui.text()).not.toContain(COPY.audioUnavailable);
    ui.all(n => n.props['aria-label'] === '听发音')[0].props.onClick();
    expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
  } finally { ui.app.unmount(); }
});
