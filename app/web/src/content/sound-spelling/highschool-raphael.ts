import type {SoundSpellingLesson} from './types';

export const highschoolRaphael: SoundSpellingLesson[] = [{
  headword: 'Raphael',
  ipa: '/ˈræfeɪəl/',
  uk: '/ˈræfeɪəl/',
  chunks: [
    {letters: 'Raph', sound: '/ræf/', stress: 'primary', hint: '此部分重读。',
      pairs: [{letters: 'R', sound: '/r/'}, {letters: 'a', sound: '/æ/'}, {letters: 'ph', sound: '/f/'}],
      tip: 'ph 在这里整体对应 /f/。'},
    {letters: 'a', sound: '/eɪ/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'a', sound: '/eɪ/'}],
      tip: '这组字母在所列英式读法中对应 /eɪ/。'},
    {letters: 'el', sound: '/əl/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'e', sound: '/ə/'}, {letters: 'l', sound: '/l/'}],
      tip: '词尾轻读；分段是拼写提示，不等同严格音节划分。'}
  ],
  anchor: {text: '拉斐尔：先听整词，再按 Raph + a + el 记拼写。'},
  variantNote: '这里采用词典所列画家名字的一种英式读法；美式及意大利语读法可能不同。现有录音的具体音标尚待试听确认。',
  sources: [{label: 'Collins English Dictionary · Raphael', url: 'https://www.collinsdictionary.com/dictionary/english/raphael'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
