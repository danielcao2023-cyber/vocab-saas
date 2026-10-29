import type {SoundSpellingLesson} from './types';

export const highschoolRenoir: SoundSpellingLesson[] = [{
  headword: 'Renoir', ipa: '/rənˈwɑːr/', uk: '/ˈrenwɑː/',
  chunks: [
    {letters: 'Re', sound: '/rə/', stress: 'none', hint: '美式读法的开头轻读。',
      pairs: [{letters: 'R', sound: '/r/'}, {letters: 'e', sound: '/ə/'}],
      tip: 'e 在这里对应弱读 /ə/。'},
    {letters: 'noir', sound: '/nˈwɑːr/', stress: 'primary', hint: '美式读法重读后半部分。',
      pairs: [{letters: 'n', sound: '/n/'}, {letters: 'oi', sound: '/wɑː/'}, {letters: 'r', sound: '/r/'}],
      tip: 'oi 在所列美式读法中对应 /wɑː/；末尾 r 发音。'}
  ],
  anchor: {text: '雷诺阿：先听整词，再按 Re + noir 记拼写；这个分块用于记忆，不严格等同音节。'},
  variantNote: '这里的对应采用剑桥词典所列美式英语读法；英式重音及尾音不同，法语读法也可能不同。现有录音与上述读法是否一致仍需试听。',
  sources: [{label: 'Cambridge Dictionary · Renoir', url: 'https://dictionary.cambridge.org/pronunciation/english/renoir'}, {label: 'Collins English Dictionary · Renoir', url: 'https://www.collinsdictionary.com/dictionary/english/renoir'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
