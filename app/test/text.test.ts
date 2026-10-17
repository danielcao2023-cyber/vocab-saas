import { afterEach, expect, it, vi } from 'vitest';
import { speak } from '../web/src/api.ts';
import * as text from '../server/src/text.ts';

afterEach(() => vi.unstubAllGlobals());
it('normalizes all three curriculum apostrophes', () => {
  expect(text.normalizeQuotes('o’clock')).toBe("o'clock");
  expect(text.normalizeQuotes('‘yes’ ʼ')).toBe("'yes' '");
});
it.each([['a / an', 'a'], ['actor / actress', 'actor'], ['colour (AmE color)', 'colour'], ['o’clock', "o'clock"]])('speaks the first main headword: %s', (headword, expected) => {
  let spoken = '';
  const speech = { cancel() {}, speak(u: { text: string }) { spoken = u.text; } };
  vi.stubGlobal('window', { speechSynthesis: speech });
  vi.stubGlobal('speechSynthesis', speech);
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  expect(speak(headword)).toBe(true);
  expect(spoken).toBe(expected);
});
