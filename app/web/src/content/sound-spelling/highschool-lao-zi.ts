import type {SoundSpellingLesson} from './types';

export const highschoolLaoZi: SoundSpellingLesson[] = [{
  headword: 'Lao Zi', ipa: '/ˈlaʊ ˈzɪə/', uk: '/ˈlaʊ ˈzɪə/',
  chunks: [
    {letters: 'Lao ', sound: '/ˈlaʊ /', stress: 'primary', hint: '第一部分读 /laʊ/。',
      pairs: [{letters: 'L', sound: '/l/'}, {letters: 'ao', sound: '/aʊ/'}, {letters: ' ', sound: ''}], tip: '在这个英语读法中，ao 对应 /aʊ/。'},
    {letters: 'Zi', sound: '/ˈzɪə/', stress: 'primary', hint: '第二部分读 /zɪə/。',
      pairs: [{letters: 'Z', sound: '/z/'}, {letters: 'i', sound: '/ɪə/'}], tip: '按词典所列英语读法记住整段 Zi。'}
  ],
  anchor: {text: '老子：结合词典读法，按 Lao + Zi 记住名称。'},
  variantNote: '这里采用 Collins 所列英式英语读法；汉语拼音和其他英语读法可能不同。现有录音与此音标尚未逐一听辨。',
  sources: [{label: 'Collins · Lao Zi (British English)', url: 'https://www.collinsdictionary.com/us/dictionary/english/lao-zi'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
