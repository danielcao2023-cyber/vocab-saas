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

highschoolConcentrateOn.push({
 headword:'consist of',ipa:'/kənˈsɪst əv/',
 chunks:[
  {letters:'con',sound:'/kən/',stress:'none',hint:'开头轻读。',pairs:[{letters:'c',sound:'/k/'},{letters:'o',sound:'/ə/'},{letters:'n',sound:'/n/'}],tip:'轻读元音 /ə/。'},
  {letters:'sist ',sound:'/sɪst/',stress:'primary',hint:'重音在 sist。',pairs:[{letters:'s',sound:'/s/'},{letters:'i',sound:'/ɪ/'},{letters:'s',sound:'/s/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}],tip:'短元音 /ɪ/ 要读清楚。'},
  {letters:'of',sound:'/əv/',stress:'none',hint:'of 在这里轻读。',pairs:[{letters:'o',sound:'/ə/'},{letters:'f',sound:'/v/'}],tip:'字母 f 在此读 /v/。'},
 ],
 anchor:{text:'注意 consist 重音在后，of 在这条美式读法中轻读。'},
 variantNote:'这里采用剑桥词典列出的美式读法；实际句中重音与弱读可变化。',
 sources:[{label:'Cambridge Dictionary · consist of 发音',url:'https://dictionary.cambridge.org/pronunciation/english/consist-of'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; phrase pronunciation checked against Cambridge'},
});

highschoolConcentrateOn.push({
 headword:'due to',ipa:'/ˈdjuː tuː/',uk:'/ˈdjuː tuː/',
 chunks:[
  {letters:'due ',sound:'/djuː/',stress:'primary',hint:'这里采用英式 /djuː/。',pairs:[{letters:'d',sound:'/d/'},{letters:'ue',sound:'/juː/'},{letters:' ',sound:''}],tip:'先读 /d/，再读 /juː/。'},
  {letters:'to',sound:'/tuː/',stress:'none',hint:'to 在这条读法中读 /tuː/。',pairs:[{letters:'t',sound:'/t/'},{letters:'o',sound:'/uː/'}],tip:'在句中 to 也可能弱读。'},
 ],
 anchor:{text:'先读 due，再接 to；结合语境听弱读。'},
 variantNote:'读音参照 Collins，重音标记参照教材词表；to 在句中常有弱读变体。',
 sources:[{label:'Collins Dictionary · due to',url:'https://www.collinsdictionary.com/dictionary/english/due-to'},{label:'Contrast 1 · 教材词表',url:'https://www.edu.xunta.gal/centros/iesalfredobranas/system/files/u27/Contrast1_SB_AppendGal_11948.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against Collins and textbook word list'},
});

highschoolConcentrateOn.push({
 headword:'look forward to',ipa:'/ˌlʊk ˈfɔːwəd tə/',uk:'/ˌlʊk ˈfɔːwəd tə/',
 chunks:[
  {letters:'look ',sound:'/lʊk/',stress:'secondary',hint:'look 在词表中标次重音。',pairs:[{letters:'l',sound:'/l/'},{letters:'oo',sound:'/ʊ/'},{letters:'k',sound:'/k/'},{letters:' ',sound:''}],tip:'oo 在这里读短音 /ʊ/。'},
  {letters:'for',sound:'/fɔː/',stress:'primary',hint:'forward 的前半部分重读。',pairs:[{letters:'f',sound:'/f/'},{letters:'or',sound:'/ɔː/'}],tip:'这里采用非卷舌英音。'},
  {letters:'ward ',sound:'/wəd/',stress:'none',hint:'后半部分轻读。',pairs:[{letters:'w',sound:'/w/'},{letters:'a',sound:'/ə/'},{letters:'r',sound:''},{letters:'d',sound:'/d/'},{letters:' ',sound:''}],tip:'r 在此英式读法中不单独发音。'},
  {letters:'to',sound:'/tə/',stress:'none',hint:'to 在这一读法中弱读。',pairs:[{letters:'t',sound:'/t/'},{letters:'o',sound:'/ə/'}],tip:'to 的读音和句中重音会随语境变化。'},
 ],
 anchor:{text:'先读 look forward，后接轻读 to，再放回句中练习。'},
 variantNote:'这里展示教材词表中的英式读法；美式常读卷舌音，语流中的重音与弱读也会变化。',
 sources:[{label:'Pearson Focus 2 教材词表',url:'https://www.pearson.com/content/dam/one-dot-com/one-dot-com/english/Images/FocusSecondEdition/Focus_2E_SB2_U1.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; British phrase pronunciation checked against Pearson wordlist'},
});

highschoolConcentrateOn.push({
 headword:'dress up',ipa:'/drɛs ˈʌp/',
 chunks:[
  {letters:'dress ',sound:'/drɛs/',stress:'none',hint:'先读 dress。',pairs:[{letters:'d',sound:'/d/'},{letters:'r',sound:'/r/'},{letters:'e',sound:'/ɛ/'},{letters:'ss',sound:'/s/'},{letters:' ',sound:''}],tip:'双写 ss 对应一个 /s/。'},
  {letters:'up',sound:'/ʌp/',stress:'primary',hint:'这条美式读法中 up 重读。',pairs:[{letters:'u',sound:'/ʌ/'},{letters:'p',sound:'/p/'}],tip:'up 中读 /ʌ/。'},
 ],
 anchor:{text:'dress 和 up 连起来读，留意双写 ss 只发一个 /s/。'},
 variantNote:'此处采用 Collins 短语动词的美式读法；句中重音会随语境变化。',
 sources:[{label:'Collins Dictionary · dress up 短语动词',url:'https://www.collinsdictionary.com/us/dictionary/english/dress-up'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; American phrasal-verb pronunciation checked against Collins'},
});
