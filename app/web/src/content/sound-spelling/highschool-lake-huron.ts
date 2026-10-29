import type {SoundSpellingLesson} from './types';

export const highschoolLakeHuron: SoundSpellingLesson[] = [{
  headword: 'Lake Huron',
  ipa: '/ˌleɪk ˈhjʊrɑːn/',
  uk: '/ˌleɪk ˈhjʊərən/',
  chunks: [
    {letters: 'Lake ', sound: '/leɪk/', stress: 'secondary', hint: '此部分次重读。',
      pairs: [{letters: 'L', sound: '/l/'}, {letters: 'a', sound: '/eɪ/'}, {letters: 'k', sound: '/k/'}, {letters: 'e ', sound: ''}],
      tip: 'Lake 的结尾 e 不单独发音，空格不发音。'},
    {letters: 'Hu', sound: '/hjʊ/', stress: 'primary', hint: '此部分重读。',
      pairs: [{letters: 'H', sound: '/h/'}, {letters: 'u', sound: '/jʊ/'}],
      tip: 'Huron 的第一部分重读，u 在此对应 /jʊ/。'},
    {letters: 'ron', sound: '/rɑːn/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'r', sound: '/r/'}, {letters: 'o', sound: '/ɑː/'}, {letters: 'n', sound: '/n/'}],
      tip: '这是所列美式读法；英式读法的元音不同。'}
  ],
  anchor: {text: '休伦湖：先听整个地名，再按 Lake + Huron 记拼写。'},
  variantNote: '上面按词典美式读法分段；英式读法为 /ˌleɪk ˈhjʊərən/，其中 Huron 的元音有变化。分段是拼写提示，不等同于严格音节划分。',
  sources: [{label: 'Cambridge Dictionary · Lake Huron', url: 'https://dictionary.cambridge.org/dictionary/english/lake-huron'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
