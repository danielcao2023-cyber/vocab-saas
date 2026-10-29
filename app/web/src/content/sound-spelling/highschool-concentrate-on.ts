import type {SoundSpellingLesson} from './types';
import {highschoolWelcomeImpress} from './highschool-welcome-impress';

const concentrate = highschoolWelcomeImpress.find(item => item.headword === 'concentrate')!;
// The map follows the British pronunciation shown in the Pearson word list.
const britishChunks = concentrate.chunks.map(chunk => ({
 ...chunk,
 sound: chunk.sound.replace('ɑː', 'ɒ'),
 pairs: chunk.pairs.map(pair => ({...pair, sound: pair.sound.replace('ɑː', 'ɒ')})),
}));
britishChunks[britishChunks.length - 1].letters += ' ';
britishChunks[britishChunks.length - 1].pairs.push({letters: ' ', sound: ''});

export const highschoolConcentrateOn: SoundSpellingLesson[] = [{
 headword: 'concentrate on', ipa: '/ˈkɒnsəntreɪt ɒn/', uk: '/ˈkɒnsəntreɪt ɒn/',
 chunks: [...britishChunks, {
  letters: 'on', sound: '/ɒn/', stress: 'none', hint: '介词 on 在这里接在动词后。',
  pairs: [{letters: 'o', sound: '/ɒ/'}, {letters: 'n', sound: '/n/'}],
  tip: '整组读音与句中重音会随语境变化。',
 }],
 anchor: {text: '先读 concentrate，再接 on；练习时可以把它放回句子里。'},
 variantNote: '这里展示词表中的英式读法；实际语流中音节和重音可能变化。',
 sources: [{label: 'Pearson English Class B1+ 词表', url: 'https://www.pearson.pl/fileadmin/poland/english/Documents/English_Class_B1P_SB_listy_slow.pdf'}],
 review: {status: 'reviewed', reviewedAt: '2026-10-29', draftedBy: 'Codex; British phrase pronunciation checked against Pearson'},
}];
