import type {SoundSpellingLesson} from './types';

export const highschoolRembrandt: SoundSpellingLesson[] = [{
  headword: 'Rembrandt',
  ipa: '/ˈrɛmbrænt/',
  uk: '/ˈrɛmbrænt/',
  chunks: [
    {letters: 'Rem', sound: '/ˈrɛm/', stress: 'primary', hint: '首部分重读。',
      pairs: [{letters: 'R', sound: '/r/'}, {letters: 'e', sound: '/ɛ/'}, {letters: 'm', sound: '/m/'}],
      tip: '先听清开头的 /rɛm/。'},
    {letters: 'brandt', sound: '/brænt/', stress: 'none', hint: '记住词尾字母顺序。',
      pairs: [{letters: 'br', sound: '/br/'}, {letters: 'a', sound: '/æ/'}, {letters: 'n', sound: '/n/'}, {letters: 'dt', sound: '/t/'}],
      tip: '在所列英语读法中，词尾 dt 合起来对应 /t/，不额外发出一个 /d/。'}
  ],
  anchor: {text: '伦勃朗：先听整词，再按 Rem + brandt 记住拼写。'},
  variantNote: '这里采用词典列出的英式英语读法；美式还有其他元音变体，荷兰语原名读法也可能不同。现有录音尚待试听确认。',
  sources: [{label: 'Collins English Dictionary · Rembrandt', url: 'https://www.collinsdictionary.com/dictionary/english/rembrandt'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
