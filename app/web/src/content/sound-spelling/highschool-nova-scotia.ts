import type {SoundSpellingLesson} from './types';

export const highschoolNovaScotia: SoundSpellingLesson[] = [{
  headword: 'Nova Scotia',
  ipa: '/ˌnoʊvə ˈskoʊʃə/',
  uk: '/ˌnəʊvə ˈskəʊʃə/',
  chunks: [
    {letters: 'No', sound: '/noʊ/', stress: 'secondary', hint: '此部分次重读。',
      pairs: [{letters: 'N', sound: '/n/'}, {letters: 'o', sound: '/oʊ/'}],
      tip: 'No 的元音在美式读法中为 /oʊ/。'},
    {letters: 'va ', sound: '/və/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'v', sound: '/v/'}, {letters: 'a', sound: '/ə/'}, {letters: ' ', sound: ''}],
      tip: 'a 弱读为 /ə/，空格不发音。'},
    {letters: 'Sco', sound: '/skoʊ/', stress: 'primary', hint: '此部分重读。',
      pairs: [{letters: 'S', sound: '/s/'}, {letters: 'c', sound: '/k/'}, {letters: 'o', sound: '/oʊ/'}],
      tip: '主要重音落在 Sco。'},
    {letters: 'tia', sound: '/ʃə/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'ti', sound: '/ʃ/'}, {letters: 'a', sound: '/ə/'}],
      tip: 'tia 在这里对应 /ʃə/。'}
  ],
  anchor: {text: '加拿大新斯科舍省：先听整个名称，再按 Nova + Scotia 记拼写。'},
  variantNote: '上面使用加拿大及美式英语音标；英式英语中的两个 /oʊ/ 通常写作 /əʊ/。',
  sources: [{label: 'Wiktionary · English pronunciation', url: 'https://en.wiktionary.org/wiki/Nova_Scotia#English'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
