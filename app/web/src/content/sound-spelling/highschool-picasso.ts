import type {SoundSpellingLesson} from './types';

export const highschoolPicasso: SoundSpellingLesson[] = [{
  headword: 'Picasso',
  ipa: '/pɪˈkɑːsoʊ/',
  uk: '/pɪˈkæsəʊ/',
  chunks: [
    {letters: 'Pi', sound: '/pɪ/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'P', sound: '/p/'}, {letters: 'i', sound: '/ɪ/'}],
      tip: '开头的 i 读 /ɪ/。'},
    {letters: 'ca', sound: '/kɑː/', stress: 'primary', hint: '此部分重读。',
      pairs: [{letters: 'c', sound: '/k/'}, {letters: 'a', sound: '/ɑː/'}],
      tip: '这部分重读；所列美式读法的 a 对应 /ɑː/。'},
    {letters: 'sso', sound: '/soʊ/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'ss', sound: '/s/'}, {letters: 'o', sound: '/oʊ/'}],
      tip: '双写 ss 对应一个 /s/，末尾 o 读 /oʊ/。'}
  ],
  anchor: {text: '毕加索：先听整词，再按 Pi + ca + sso 记拼写。'},
  variantNote: '这里采用剑桥词典所列美式英语读法；英式重读元音为 /æ/，词尾写作 /əʊ/。录音口音尚待试听确认。',
  sources: [{label: 'Cambridge Dictionary · Picasso pronunciation', url: 'https://dictionary.cambridge.org/pronunciation/english/picasso'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
