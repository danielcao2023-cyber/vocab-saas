import type {SoundSpellingLesson} from './types';

export const highschoolNiagaraFalls: SoundSpellingLesson[] = [{
  headword: 'Niagara Falls',
  ipa: '/naɪˈæɡɹə fɔlz/',
  uk: '/naɪˈæɡəɹə fɔːlz/',
  chunks: [
    {letters: 'Ni', sound: '/naɪ/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'N', sound: '/n/'}, {letters: 'i', sound: '/aɪ/'}],
      tip: 'Ni 对应 /naɪ/。'},
    {letters: 'aga', sound: '/æɡ/', stress: 'primary', hint: '此部分重读。',
      pairs: [{letters: 'a', sound: '/æ/'}, {letters: 'g', sound: '/ɡ/'}, {letters: 'a', sound: ''}],
      tip: '第二段重读；此读法中后一个 a 不单独发音。'},
    {letters: 'ra ', sound: '/ɹə/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'r', sound: '/ɹ/'}, {letters: 'a', sound: '/ə/'}, {letters: ' ', sound: ''}],
      tip: '末尾 a 弱读，空格不发音。'},
    {letters: 'Falls', sound: '/fɔlz/', stress: 'none', hint: '瀑布部分。',
      pairs: [{letters: 'F', sound: '/f/'}, {letters: 'a', sound: '/ɔ/'}, {letters: 'll', sound: '/l/'}, {letters: 's', sound: '/z/'}],
      tip: 'll 对应 /l/，词尾 s 在这里读 /z/。'}
  ],
  anchor: {text: '尼亚加拉瀑布：先听地名，再按 Niagara + Falls 记拼写。'},
  variantNote: '上面采用词典所列的一种美式读法；其他读法可能多一个弱读元音，或将 Falls 中的元音读作 /ɑ/。英式读法也有不同。',
  sources: [{label: 'Wiktionary · English pronunciation', url: 'https://en.wiktionary.org/wiki/Niagara_Falls#English'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
