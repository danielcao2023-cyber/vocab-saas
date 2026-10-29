import type { SoundSpellingLesson } from './types';

/** Cambridge lists both UK and US /ˈdʒuː.ɪʃ/. The groups below are spelling-to-sound aids. */
export const highschoolJewishVerified: SoundSpellingLesson[] = [{
  headword: 'Jewish', ipa: '/ˈdʒuːɪʃ/', uk: '/ˈdʒuːɪʃ/',
  chunks: [
    {letters: 'Jew', sound: '/dʒuː/', stress: 'primary', hint: '第一部分重读。',
      pairs: [{letters: 'J', sound: '/dʒ/'}, {letters: 'ew', sound: '/uː/'}], tip: 'ew 在这里读 /uː/。'},
    {letters: 'ish', sound: '/ɪʃ/', stress: 'none', hint: '第二部分轻读。',
      pairs: [{letters: 'i', sound: '/ɪ/'}, {letters: 'sh', sound: '/ʃ/'}], tip: 'sh 合起来读 /ʃ/。'}
  ],
  anchor: {text: '先重读 Jew，再轻读 ish。'},
  variantNote: '此处采用剑桥词典列出的英美读音；分组用于帮助拼读。',
  sources: [{label: 'Cambridge Dictionary · Jewish 发音', url: 'https://dictionary.cambridge.org/pronunciation/english/jewish'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex spelling-sound alignment'}
}];
