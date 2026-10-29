import type {SoundSpellingLesson} from './types';

export const highschoolSriLanka: SoundSpellingLesson[] = [{
  headword: 'Sri Lanka', ipa: '/ˌsri ˈlɑŋkə/',
  chunks: [
    {letters: 'Sri ', sound: '/ˌsri /', stress: 'secondary', hint: '次重音。', pairs: [{letters: 'S', sound: '/s/'}, {letters: 'r', sound: '/r/'}, {letters: 'i', sound: '/i/'}, {letters: ' ', sound: ''}], tip: '这里的 Sri 读作 /sri/。'},
    {letters: 'Lanka', sound: '/ˈlɑŋkə/', stress: 'primary', hint: '主要重音。', pairs: [{letters: 'L', sound: '/l/'}, {letters: 'a', sound: '/ɑ/'}, {letters: 'n', sound: '/ŋ/'}, {letters: 'k', sound: '/k/'}, {letters: 'a', sound: '/ə/'}], tip: 'n 在 k 前对应 /ŋ/，末尾 a 弱读 /ə/。'},
  ],
  anchor: {text: '斯里兰卡：分成 Sri 和 Lanka 两部分记住拼写。'},
  variantNote: '这里采用牛津词典列出的一种北美英语读法；Sri 也可读 /ʃri/。现有录音尚未试听核对。',
  sources: [{label: 'Oxford Advanced American Dictionary · Sri Lanka', url: 'https://www.oxfordlearnersdictionaries.com/us/definition/american_english/sri-lanka'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'},
}];
