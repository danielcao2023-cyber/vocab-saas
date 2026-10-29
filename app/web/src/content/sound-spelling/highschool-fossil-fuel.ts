import type {SoundSpellingLesson} from './types';

export const highschoolFossilFuel: SoundSpellingLesson[] = [{
  headword: 'fossil fuel',
  ipa: '/ˈfɒsəl ˌfjʊəl/',
  uk: '/ˈfɒsəl ˌfjʊəl/',
  chunks: [
    {letters: 'foss', sound: '/fɒs/', stress: 'primary', hint: '此部分重读。',
      pairs: [{letters: 'f', sound: '/f/'}, {letters: 'o', sound: '/ɒ/'}, {letters: 'ss', sound: '/s/'}],
      tip: '双写 ss 在此对应一个 /s/。'},
    {letters: 'il ', sound: '/əl/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'i', sound: '/ə/'}, {letters: 'l', sound: '/l/'}, {letters: ' ', sound: ''}],
      tip: 'i 弱读为 /ə/，空格不发音。'},
    {letters: 'fu', sound: '/fjʊ/', stress: 'secondary', hint: '此部分次重读。',
      pairs: [{letters: 'f', sound: '/f/'}, {letters: 'u', sound: '/jʊ/'}],
      tip: '此处采用词典所列英式读法。'},
    {letters: 'el', sound: '/əl/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'e', sound: '/ə/'}, {letters: 'l', sound: '/l/'}],
      tip: 'e 和 l 对应 /əl/。'}
  ],
  anchor: {text: '化石燃料：先听整个词组，再按 fossil + fuel 记拼写。'},
  variantNote: '上面是词典所列英式读法；该词典的美式读法为 /ˈfɑːsəl ˌfuːəl/，其他词典也列出不同变体。',
  sources: [{label: 'Cambridge Dictionary · fossil fuel pronunciation', url: 'https://dictionary.cambridge.org/pronunciation/english/fossil-fuel'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
