import type {SoundSpellingLesson} from './types';

export const highschoolMasaccio: SoundSpellingLesson[] = [{
  headword: 'Masaccio', ipa: '/məˈsɑːtʃioʊ/', uk: '/məˈzɑːtʃəʊ/',
  chunks: [
    {letters: 'Ma', sound: '/mə/', stress: 'none', hint: '开头轻读。',
      pairs: [{letters: 'M', sound: '/m/'}, {letters: 'a', sound: '/ə/'}], tip: 'a 在所列美式读法中弱读为 /ə/。'},
    {letters: 'sa', sound: '/ˈsɑː/', stress: 'primary', hint: '这一部分重读。',
      pairs: [{letters: 's', sound: '/s/'}, {letters: 'a', sound: '/ɑː/'}], tip: '美式词典读法中 s 为 /s/。'},
    {letters: 'ccio', sound: '/tʃioʊ/', stress: 'none', hint: '留意双写 c。',
      pairs: [{letters: 'cc', sound: '/tʃ/'}, {letters: 'i', sound: '/i/'}, {letters: 'o', sound: '/oʊ/'}], tip: '这是对应所列美式读法的拼写提示，不是通用拼读规则。'}
  ],
  anchor: {text: '马萨乔：先听整词，再按 Ma + sa + ccio 记住拼写。'},
  variantNote: '此处采用剑桥词典所列美式英语读法；所列英式读法中 s 读 /z/，尾音也不同。其他英语及意大利语读法可能不同；现有录音仍需试听。',
  sources: [{label: 'Cambridge Dictionary · Masaccio', url: 'https://dictionary.cambridge.org/pronunciation/english/masaccio'}, {label: 'Collins English Dictionary · Masaccio', url: 'https://www.collinsdictionary.com/dictionary/english/masaccio'}],
  review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex phoneme/letter alignment'}
}];
