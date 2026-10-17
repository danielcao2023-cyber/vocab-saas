import { afterEach, expect, it, vi } from 'vitest';
import { speak, stopAudio } from '../web/src/api.ts';
import * as text from '../server/src/text.ts';
import { mockAudio, MockAudio } from './audio-fixtures.ts';

afterEach(() => { stopAudio(); vi.unstubAllGlobals(); });
it('normalizes all three curriculum apostrophes', () => {
  expect(text.normalizeQuotes('o’clock')).toBe("o'clock");
  expect(text.normalizeQuotes('‘yes’ ʼ')).toBe("'yes' '");
});
it.each([['a / an', 'a'], ['actor / actress', 'actor'], ['colour (AmE color)', 'colour'], ['o’clock', "o'clock"], ['China', 'China']])('plays the first main headword: %s', async (headword, expected) => {
  mockAudio();
  const result = speak(headword);
  const audio = MockAudio.instances[0];
  expect(audio.src).toBe(`/api/pronunciation/audio?word=${encodeURIComponent(expected)}`);
  audio.emit('ended');
  await expect(result).resolves.toEqual({ status: 'success' });
});
