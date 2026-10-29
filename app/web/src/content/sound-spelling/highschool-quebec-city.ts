import type {SoundSpellingLesson} from './types';

export const highschoolQuebecCity: SoundSpellingLesson[] = [{
  headword: 'Quebec City',
  ipa: '/kəˈbɛk ˈsɪti/',
  chunks: [
    {letters: 'Que', sound: '/kə/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'Q', sound: '/k/'}, {letters: 'ue', sound: '/ə/'}],
      tip: '这是词典所列的一种加拿大英语读法，开头轻读。'},
    {letters: 'bec ', sound: '/bɛk/', stress: 'primary', hint: 'Quebec 的重音在这里。',
      pairs: [{letters: 'b', sound: '/b/'}, {letters: 'e', sound: '/ɛ/'}, {letters: 'c', sound: '/k/'}, {letters: ' ', sound: ''}],
      tip: 'bec 重读；空格不发音。'},
    {letters: 'Ci', sound: '/sɪ/', stress: 'primary', hint: 'City 的重音在这里。',
      pairs: [{letters: 'C', sound: '/s/'}, {letters: 'i', sound: '/ɪ/'}],
      tip: 'City 中 C 对应 /s/。'},
    {letters: 'ty', sound: '/ti/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 't', sound: '/t/'}, {letters: 'y', sound: '/i/'}],
      tip: '末尾 y 在此对应 /i/。'}
  ],
  anchor: {text: '魁北克市：按 Quebec + City 记住两个词的拼写。'},
  variantNote: '词典还列出 Quebec 开头的 /kwɪˈbɛk/ 和 /kɛˈbɛk/ 等加拿大英语读法；连读时 City 的 t 也可能发生变化。',
  sources: [{label: 'Wiktionary · English pronunciation', url: 'https://en.wiktionary.org/wiki/Quebec_City#English'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
