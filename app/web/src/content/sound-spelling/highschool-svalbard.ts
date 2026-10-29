import type {SoundSpellingLesson} from './types';

export const highschoolSvalbard: SoundSpellingLesson[] = [{
  headword: 'Svalbard',
  ipa: '/ˈsvælbɑːd/',
  uk: '/ˈsvælbɑːd/',
  chunks: [
    {letters: 'Sval', sound: '/ˈsvæl/', stress: 'primary', hint: '第一部分重读。',
      pairs: [{letters: 'S', sound: '/s/'}, {letters: 'v', sound: '/v/'}, {letters: 'a', sound: '/æ/'}, {letters: 'l', sound: '/l/'}],
      tip: 'S 和 v 连读，a 在此读 /æ/。'},
    {letters: 'bard', sound: '/bɑːd/', stress: 'none', hint: '第二部分轻读。',
      pairs: [{letters: 'b', sound: '/b/'}, {letters: 'ar', sound: '/ɑː/'}, {letters: 'd', sound: '/d/'}],
      tip: '这个英式读法里 ar 对应 /ɑː/，词尾 d 发音。'}
  ],
  anchor: {text: '斯瓦尔巴群岛：先听整词，再按 Sval + bard 记拼写。'},
  variantNote: '这里采用词典所列的英式读法 /ˈsvælbɑːd/；也有词尾 d 不发音的读法。美式读法中的元音和 r 音可能不同。',
  sources: [{label: 'Wiktionary · English pronunciation', url: 'https://en.wiktionary.org/wiki/Svalbard#English'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
