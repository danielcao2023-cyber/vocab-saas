import { expect, it } from 'vitest';
import { englishSection } from '../scripts/lesson-sources.ts';

it('uses only the English entry even when French or another language precedes it', () => {
  const page='== {{langue|fr}} ==\nFrench noun\n=== {{S|étymologie}} ===\nFrench history\n== {{langue|en}} ==\n=== {{S|étymologie}} ===\nEnglish history\n=== {{S|nom|en}} ===\nEnglish noun\n== {{langue|de}} ==\nGerman noun';
  expect(englishSection(page)).toBe('=== {{S|étymologie}} ===\nEnglish history\n=== {{S|nom|en}} ===\nEnglish noun');
});
it('does not mistake an etymology subsection or another language for English', () => {
  expect(englishSection('== {{langue|fr}} ==\nFrom English')).toBeNull();
  expect(englishSection('== {{langue|en}} ==\n=== Etymology 1 ===\nFirst\n=== Etymology 2 ===\nSecond')).toContain('Second');
});
