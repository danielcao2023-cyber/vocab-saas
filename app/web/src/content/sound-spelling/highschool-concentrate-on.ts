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

highschoolConcentrateOn.push({
 headword: 'at last', ipa: '/ət ˈlɑːst/', uk: '/ət ˈlɑːst/',
 chunks: [
  {letters:'at ',sound:'/ət/',stress:'none',hint:'at 在这一读法中弱读。',pairs:[{letters:'a',sound:'/ə/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}],tip:'真实语流中弱读会随语境变化。'},
  {letters:'last',sound:'/lɑːst/',stress:'primary',hint:'last 重读；这里使用英式读音。',pairs:[{letters:'l',sound:'/l/'},{letters:'a',sound:'/ɑː/'},{letters:'s',sound:'/s/'},{letters:'t',sound:'/t/'}],tip:'美式常见 /læst/。'},
 ],
 anchor: {text:'at 轻读，last 清楚读出；放在句中再听听。'},
 variantNote:'这里展示词表中的英式读法；实际句中重音会随语境变化。',
 sources: [{label:'Pearson English Class B1+ 词表',url:'https://www.pearson.pl/fileadmin/poland/english/Documents/English_Class_B1P_SB_listy_slow.pdf'}],
 review: {status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; British phrase pronunciation checked against Pearson'},
});

highschoolConcentrateOn.push({
 headword:'trip over',ipa:'/trɪp ˈəʊvə/',uk:'/trɪp ˈəʊvə/',
 chunks:[
  {letters:'trip ',sound:'/trɪp/',stress:'none',hint:'先读 trip。',pairs:[{letters:'t',sound:'/t/'},{letters:'r',sound:'/r/'},{letters:'i',sound:'/ɪ/'},{letters:'p',sound:'/p/'},{letters:' ',sound:''}],tip:'p 可与后面的元音连读。'},
  {letters:'o',sound:'/əʊ/',stress:'primary',hint:'词表重音落在 over。',pairs:[{letters:'o',sound:'/əʊ/'}],tip:'这里采用英式 /əʊ/。'},
  {letters:'ver',sound:'/və/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'v',sound:'/v/'},{letters:'e',sound:'/ə/'},{letters:'r',sound:''}],tip:'此处采用非卷舌英音，词尾 r 不单独发音。'},
 ],
 anchor:{text:'把 trip 和 over 连起来读，结合句子练习。'},
 variantNote:'这里展示词表中的英式读法；句中重音及连读会随语境变化。',
 sources:[{label:'Pearson English Class B1+ 词表',url:'https://www.pearson.pl/fileadmin/poland/english/Documents/English_Class_B1P_SB_listy_slow.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; British phrase pronunciation checked against Pearson'},
});
