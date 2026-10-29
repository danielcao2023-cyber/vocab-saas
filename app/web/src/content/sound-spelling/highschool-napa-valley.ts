import type {SoundSpellingLesson} from './types';

export const highschoolNapaValley: SoundSpellingLesson[] = [{
  headword: 'Napa Valley', ipa: '/ˌnæpəˈvæli/', uk: '/ˌnæpəˈvæli/',
  chunks: [
    {letters: 'Nap', sound: '/næp/', stress: 'secondary', hint: 'Napa 的第一部分次重读。', pairs: [{letters: 'N', sound: '/n/'}, {letters: 'a', sound: '/æ/'}, {letters: 'p', sound: '/p/'}], tip: 'a 在这里对应 /æ/。'},
    {letters: 'a ', sound: '/ə/', stress: 'none', hint: 'Napa 的末尾轻读。', pairs: [{letters: 'a', sound: '/ə/'}, {letters: ' ', sound: ''}], tip: '末尾 a 弱读为 /ə/。'},
    {letters: 'Valley', sound: '/væli/', stress: 'primary', hint: 'Valley 的第一音节主重读。', pairs: [{letters: 'V', sound: '/v/'}, {letters: 'a', sound: '/æ/'}, {letters: 'll', sound: '/l/'}, {letters: 'ey', sound: '/i/'}], tip: '两个 l 合起来对应一个 /l/；末尾 ey 对应 /i/。'}
  ],
  anchor: {text: '美国加利福尼亚州的纳帕谷；完整名称中 Valley 主重读。'},
  variantNote: '这里采用剑桥词典所列的英式和美式完整名称读法；连贯语流中的重音可能变化。',
  sources: [{label: 'Cambridge Dictionary · Napa Valley', url: 'https://dictionary.cambridge.org/pronunciation/english/napa-valley'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex dictionary-based spelling alignment'}
}];
