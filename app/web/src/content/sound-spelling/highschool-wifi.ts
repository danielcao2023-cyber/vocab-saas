import type {SoundSpellingLesson} from './types';

export const highschoolWifi: SoundSpellingLesson = {
 headword: 'Wi-Fi', ipa: '/ˈwaɪ.faɪ/', uk: '/ˈwaɪ.faɪ/',
 chunks: [
  {letters: 'Wi-', sound: '/waɪ/', stress: 'primary', hint: '第一部分重读，连字符不发音。', pairs: [{letters: 'W', sound: '/w/'}, {letters: 'i', sound: '/aɪ/'}, {letters: '-', sound: '不发音'}], tip: 'Wi 读 /waɪ/。'},
  {letters: 'Fi', sound: '/faɪ/', stress: 'none', hint: '第二部分读 /faɪ/。', pairs: [{letters: 'F', sound: '/f/'}, {letters: 'i', sound: '/aɪ/'}], tip: 'Fi 与 Wi 的元音相同。'}
 ],
 anchor: {text: 'Wi 重读，Fi 跟读；中间连字符不发音。'},
 variantNote: '这是 Wi-Fi 这一词的读法，不是所有字母 i 的通用发音规则。',
 sources: [{label: 'Cambridge Dictionary · Wi-Fi 发音', url: 'https://dictionary.cambridge.org/pronunciation/english/wi-fi'}],
 review: {status: 'reviewed', reviewedAt: '2026-10-30', draftedBy: 'Codex spelling-sound alignment'}
};
