import type {SoundSpellingLesson} from './types';

export const highschoolMichelangelo: SoundSpellingLesson[] = [{
  headword: 'Michelangelo',
  ipa: '/ˌmaɪkəlˈændʒəloʊ/',
  uk: '/ˌmaɪkəlˈændʒələʊ/',
  chunks: [
    {letters: 'Mi', sound: '/maɪ/', stress: 'secondary', hint: '此部分次重读。',
      pairs: [{letters: 'M', sound: '/m/'}, {letters: 'i', sound: '/aɪ/'}],
      tip: '英文读法的开头 Mi 对应 /maɪ/。'},
    {letters: 'chel', sound: '/kəl/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'ch', sound: '/k/'}, {letters: 'e', sound: '/ə/'}, {letters: 'l', sound: '/l/'}],
      tip: 'ch 在这里对应 /k/，e 轻读。'},
    {letters: 'an', sound: '/æn/', stress: 'primary', hint: '此部分重读。',
      pairs: [{letters: 'a', sound: '/æ/'}, {letters: 'n', sound: '/n/'}],
      tip: '主要重音落在 an。'},
    {letters: 'ge', sound: '/dʒə/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'g', sound: '/dʒ/'}, {letters: 'e', sound: '/ə/'}],
      tip: '这里的 g 对应 /dʒ/。'},
    {letters: 'lo', sound: '/loʊ/', stress: 'none', hint: '此部分轻读。',
      pairs: [{letters: 'l', sound: '/l/'}, {letters: 'o', sound: '/oʊ/'}],
      tip: '末尾 o 的英式和美式音标写法不同。'}
  ],
  anchor: {text: '米开朗基罗：先听整词，再按 Mi + chel + an + ge + lo 记拼写。'},
  variantNote: '这里是词典中的英语读法；英式词尾常写 /əʊ/，美式常写 /oʊ/。意大利语读法及不同录音可能有差异。',
  sources: [{label: 'Cambridge Dictionary · Michelangelo pronunciation', url: 'https://dictionary.cambridge.org/pronunciation/english/michelangelo'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
