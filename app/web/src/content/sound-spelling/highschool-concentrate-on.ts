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

const vocabularyPracticeSource = {label:'Cambridge Vocabulary in Practice 5 词表，第 76 页',url:'https://content.fimsschools.com/ebooks/Vocabulary%20in%20Practice%20Books/Vocabulary%20in%20practice%20Book%205%20Intermediate%20to%20Upper-Intermediate.pdf'};
highschoolConcentrateOn.push({
 headword:'make progress',ipa:'/ˌmeɪk ˈprəʊɡres/',uk:'/ˌmeɪk ˈprəʊɡres/',
 chunks:[
  {letters:'make ',sound:'/meɪk/',stress:'secondary',hint:'make 在词表中标次重音。',pairs:[{letters:'m',sound:'/m/'},{letters:'a',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:'e',sound:''},{letters:' ',sound:''}],tip:'词尾 e 不单独发音。'},
  {letters:'pro',sound:'/prəʊ/',stress:'primary',hint:'progress 第一部分重读。',pairs:[{letters:'p',sound:'/p/'},{letters:'r',sound:'/r/'},{letters:'o',sound:'/əʊ/'}],tip:'这里采用英式 /əʊ/。'},
  {letters:'gress',sound:'/ɡres/',stress:'none',hint:'第二部分轻读。',pairs:[{letters:'g',sound:'/ɡ/'},{letters:'r',sound:'/r/'},{letters:'e',sound:'/e/'},{letters:'ss',sound:'/s/'}],tip:'双写 ss 对应一个 /s/。'},
 ],
 anchor:{text:'make 稍重读，progress 第一部分重读，放回句中练习。'},
 variantNote:'这里展示教材的英式读法；美式元音和句中重音可有变化。',sources:[vocabularyPracticeSource],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against Cambridge wordlist'},
});
highschoolConcentrateOn.push({
 headword:'make a difference',ipa:'/ˌmeɪk ə ˈdɪfərəns/',uk:'/ˌmeɪk ə ˈdɪfərəns/',
 chunks:[
  {letters:'make ',sound:'/meɪk/',stress:'secondary',hint:'make 在词表中标次重音。',pairs:[{letters:'m',sound:'/m/'},{letters:'a',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:'e',sound:''},{letters:' ',sound:''}],tip:'词尾 e 不单独发音。'},
  {letters:'a ',sound:'/ə/',stress:'none',hint:'a 在这里弱读。',pairs:[{letters:'a',sound:'/ə/'},{letters:' ',sound:''}],tip:'连读时声音轻短。'},
  {letters:'di',sound:'/dɪ/',stress:'primary',hint:'difference 开头重读。',pairs:[{letters:'d',sound:'/d/'},{letters:'i',sound:'/ɪ/'}],tip:'读短元音 /ɪ/。'},
  {letters:'ffer',sound:'/fər/',stress:'none',hint:'中间轻读。',pairs:[{letters:'ff',sound:'/f/'},{letters:'e',sound:'/ə/'},{letters:'r',sound:'/r/'}],tip:'双写 ff 对应一个 /f/。'},
  {letters:'ence',sound:'/əns/',stress:'none',hint:'结尾轻读。',pairs:[{letters:'e',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:'c',sound:'/s/'},{letters:'e',sound:''}],tip:'词尾 e 不单独发音。'},
 ],
 anchor:{text:'make a 轻快连接，difference 开头重读。'},
 variantNote:'这里展示教材的英式读法；实际语流中的元音和重音可有变化。',sources:[vocabularyPracticeSource],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against Cambridge wordlist'},
});

highschoolConcentrateOn.push({
 headword:'cost an arm and a leg',ipa:'/ˌkɒst ən ˌɑːm ən ə ˈleɡ/',uk:'/ˌkɒst ən ˌɑːm ən ə ˈleɡ/',
 chunks:[
  {letters:'cost ',sound:'/kɒst/',stress:'secondary',hint:'cost 在词表中标次重音。',pairs:[{letters:'c',sound:'/k/'},{letters:'o',sound:'/ɒ/'},{letters:'s',sound:'/s/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}],tip:'这里采用英式 /ɒ/。'},
  {letters:'an ',sound:'/ən/',stress:'none',hint:'an 轻读。',pairs:[{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}],tip:'与 arm 自然连接。'},
  {letters:'arm ',sound:'/ɑːm/',stress:'secondary',hint:'arm 在词表中标次重音。',pairs:[{letters:'ar',sound:'/ɑː/'},{letters:'m',sound:'/m/'},{letters:' ',sound:''}],tip:'这里采用非卷舌英音。'},
  {letters:'and ',sound:'/ən/',stress:'none',hint:'and 在这一读法中弱读。',pairs:[{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:'d',sound:''},{letters:' ',sound:''}],tip:'and 也可能读得更完整。'},
  {letters:'a ',sound:'/ə/',stress:'none',hint:'a 轻读。',pairs:[{letters:'a',sound:'/ə/'},{letters:' ',sound:''}],tip:'读短而轻的 /ə/。'},
  {letters:'leg',sound:'/leɡ/',stress:'primary',hint:'leg 是词表中的主重音。',pairs:[{letters:'l',sound:'/l/'},{letters:'e',sound:'/e/'},{letters:'g',sound:'/ɡ/'}],tip:'最后读清 /ɡ/。'},
 ],
 anchor:{text:'留意轻读的 an、and、a，再清楚读出 leg。'},
 variantNote:'这里展示教材中的一种英式读法；实际语流中的 and 和重音可能变化。',
 sources:[{label:'Oxford Solutions 2nd edition 词表',url:'https://teacherivanatheenglishlanguageblog.wordpress.com/wp-content/uploads/2015/09/2-self-test-1.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; phrase pronunciation checked against Oxford wordlist'},
});

highschoolConcentrateOn.push({
 headword:'work out',ipa:'/ˌwɜːk ˈaʊt/',uk:'/ˌwɜːk ˈaʊt/',
 chunks:[
  {letters:'work ',sound:'/wɜːk/',stress:'secondary',hint:'work 在词表中标次重音。',pairs:[{letters:'w',sound:'/w/'},{letters:'or',sound:'/ɜː/'},{letters:'k',sound:'/k/'},{letters:' ',sound:''}],tip:'这里采用非卷舌英音。'},
  {letters:'out',sound:'/aʊt/',stress:'primary',hint:'out 在词表中重读。',pairs:[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'}],tip:'ou 合起来读 /aʊ/。'},
 ],
 anchor:{text:'work 接 out 连起来读，再放进句子。'},
 variantNote:'这里展示教材中的英式读法；美式常带卷舌音，句中重音可变化。',sources:[vocabularyPracticeSource],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against Cambridge wordlist'},
});
highschoolConcentrateOn.push({
 headword:'give up',ipa:'/ˌɡɪv ˈʌp/',uk:'/ˌɡɪv ˈʌp/',
 chunks:[
  {letters:'give ',sound:'/ɡɪv/',stress:'secondary',hint:'give 在词表中标次重音。',pairs:[{letters:'g',sound:'/ɡ/'},{letters:'i',sound:'/ɪ/'},{letters:'v',sound:'/v/'},{letters:'e',sound:''},{letters:' ',sound:''}],tip:'末尾 e 不单独发音。'},
  {letters:'up',sound:'/ʌp/',stress:'primary',hint:'up 在词表中重读。',pairs:[{letters:'u',sound:'/ʌ/'},{letters:'p',sound:'/p/'}],tip:'up 中读 /ʌ/。'},
 ],
 anchor:{text:'give 与 up 连读，结合句子感受重音。'},
 variantNote:'这里展示 Pearson 词表中的读法；真实句子中的重音可变化。',
 sources:[{label:'Pearson English Class B1 词表',url:'https://www.pearson.pl/fileadmin/poland/english/Documents/English_Class_B1_SB_listy_slow.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against Pearson wordlist'},
});

highschoolConcentrateOn.push({
 headword:'take notes',ipa:'/ˌteɪk ˈnəʊts/',uk:'/ˌteɪk ˈnəʊts/',
 chunks:[
  {letters:'take ',sound:'/teɪk/',stress:'secondary',hint:'take 在词表中标次重音。',pairs:[{letters:'t',sound:'/t/'},{letters:'a',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:'e',sound:''},{letters:' ',sound:''}],tip:'词尾 e 不单独发音。'},
  {letters:'notes',sound:'/nəʊts/',stress:'primary',hint:'notes 在词表中重读。',pairs:[{letters:'n',sound:'/n/'},{letters:'o',sound:'/əʊ/'},{letters:'t',sound:'/t/'},{letters:'e',sound:''},{letters:'s',sound:'/s/'}],tip:'这里采用英式 /əʊ/。'},
 ],
 anchor:{text:'take 与 notes 连起来读，在句中练习。'},
 variantNote:'这里展示教材中的英式读法；美式元音及句中重音可能变化。',
 sources:[{label:'Jordan Grade 9 教师用书词表',url:'https://nccd.gov.jo/EBV4.0/Root_Storage/EN/2024/G9/JOR_HN_G9_Teacher%27s_Book_Print.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against Jordan textbook wordlist'},
});
highschoolConcentrateOn.push({
 headword:'make sense',ipa:'/ˌmeɪk ˈsens/',uk:'/ˌmeɪk ˈsens/',
 chunks:[
  {letters:'make ',sound:'/meɪk/',stress:'secondary',hint:'make 在词表中标次重音。',pairs:[{letters:'m',sound:'/m/'},{letters:'a',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:'e',sound:''},{letters:' ',sound:''}],tip:'词尾 e 不单独发音。'},
  {letters:'sense',sound:'/sens/',stress:'primary',hint:'sense 在词表中重读。',pairs:[{letters:'s',sound:'/s/'},{letters:'e',sound:'/e/'},{letters:'n',sound:'/n/'},{letters:'s',sound:'/s/'},{letters:'e',sound:''}],tip:'词尾 e 不单独发音。'},
 ],
 anchor:{text:'make 接 sense 连起来读，再放回句子。'},
 variantNote:'这里展示词表中的读法；句中重音可随语境变化。',
 sources:[{label:'Academic Vocabulary in Practice B1 词表',url:'https://languageadvisor.net/wp-content/uploads/2023/06/Academic_Vocabulary_Practice_Lower-Intermediate_B1.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; phrase pronunciation checked against textbook wordlist'},
});

type PhraseChunk = SoundSpellingLesson['chunks'][number];
const addSourcedPhrase=(headword:string,ipa:string,chunks:PhraseChunk[],label:string,url:string)=>{
 highschoolConcentrateOn.push({headword,ipa,uk:ipa,chunks,anchor:{text:'按字母与声音对照练读，再放回句子。'},
  variantNote:'这里展示词表中的英式读法；实际语流的重音和弱读可能变化。',sources:[{label,url}],
  review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against textbook wordlist'}});
};
const ch=(letters:string,sound:string,stress:PhraseChunk['stress'],pairs:PhraseChunk['pairs']):PhraseChunk=>({letters,sound,stress,pairs,hint:stress==='primary'?'这部分重读。':stress==='secondary'?'这部分标次重音。':'继续读这一部分。',tip:'结合完整短语和语境练读。'});
addSourcedPhrase('refer to','/rɪˈfɜː tə/',[
 ch('re','/rɪ/','none',[{letters:'r',sound:'/r/'},{letters:'e',sound:'/ɪ/'}]),
 ch('fer ','/fɜː/','primary',[{letters:'f',sound:'/f/'},{letters:'er',sound:'/ɜː/'},{letters:' ',sound:''}]),
 ch('to','/tə/','none',[{letters:'t',sound:'/t/'},{letters:'o',sound:'/ə/'}]),
],'Oxford New Headway Elementary 词表','https://ektu.kz/files/DistanceEducation/Resource/379028/hw_elem_trd_wordlist_u12.pdf');
addSourcedPhrase('try out','/ˌtraɪ ˈaʊt/',[
 ch('try ','/traɪ/','secondary',[{letters:'t',sound:'/t/'},{letters:'r',sound:'/r/'},{letters:'y',sound:'/aɪ/'},{letters:' ',sound:''}]),
 ch('out','/aʊt/','primary',[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'}]),
],'Pearson Focus NL 3 词表','https://www.pearson.com/content/dam/one-dot-com/one-dot-com/netherlands/ELT-VO/FocusNL/Focus%20NL%203%20Sample.pdf');
addSourcedPhrase('make sure','/ˌmeɪk ˈʃʊə/',[
 ch('make ','/meɪk/','secondary',[{letters:'m',sound:'/m/'},{letters:'a',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:'e',sound:''},{letters:' ',sound:''}]),
 ch('sure','/ʃʊə/','primary',[{letters:'s',sound:'/ʃ/'},{letters:'u',sound:'/ʊ/'},{letters:'re',sound:'/ə/'}]),
],'Oxford New Headway Pre-Intermediate 词表','https://ebizglow.com/wp-content/uploads/2020/06/New-Headway-Pre-Intermediate-Teacher-Book.pdf');
addSourcedPhrase('make fun of','/ˌmeɪk ˈfʌn əv/',[
 ch('make ','/meɪk/','secondary',[{letters:'m',sound:'/m/'},{letters:'a',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:'e',sound:''},{letters:' ',sound:''}]),
 ch('fun ','/fʌn/','primary',[{letters:'f',sound:'/f/'},{letters:'u',sound:'/ʌ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('of','/əv/','none',[{letters:'o',sound:'/ə/'},{letters:'f',sound:'/v/'}]),
],'Cambridge Think Level 4 词表','https://f.eba.gov.tr/ing-soru-bankasi/cambridge-01/think-level-4/69564/resources/pdf/wordlist_think_level_4_u12.pdf');

addSourcedPhrase('ups and downs','/ˌʌps ən ˈdaʊnz/',[
 ch('ups ','/ʌps/','secondary',[{letters:'u',sound:'/ʌ/'},{letters:'p',sound:'/p/'},{letters:'s',sound:'/s/'},{letters:' ',sound:''}]),
 ch('and ','/ən/','none',[{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:'d',sound:''},{letters:' ',sound:''}]),
 ch('downs','/daʊnz/','primary',[{letters:'d',sound:'/d/'},{letters:'ow',sound:'/aʊ/'},{letters:'n',sound:'/n/'},{letters:'s',sound:'/z/'}]),
],'Cambridge Dictionary · ups and downs','https://dictionary.cambridge.org/us/dictionary/english/ups-and-downs');

addSourcedPhrase('rather than','/ˈrɑːðə ðən/',[
 ch('ra','/rɑː/','primary',[{letters:'r',sound:'/r/'},{letters:'a',sound:'/ɑː/'}]),
 ch('ther ','/ðə/','none',[{letters:'th',sound:'/ð/'},{letters:'e',sound:'/ə/'},{letters:'r',sound:''},{letters:' ',sound:''}]),
 ch('than','/ðən/','none',[{letters:'th',sound:'/ð/'},{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'}]),
],'Cambridge 教材词表','https://www.cambridge.es/content/download/6137/46089/SP4_Wordlist.pdf');
addSourcedPhrase('in ruins','/ɪn ˈruːɪnz/',[
 ch('in ','/ɪn/','none',[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('ru','/ruː/','primary',[{letters:'r',sound:'/r/'},{letters:'u',sound:'/uː/'}]),
 ch('ins','/ɪnz/','none',[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:'s',sound:'/z/'}]),
],'Global Intermediate 教材词表','https://stichwoerter.hueber.de/media/36/Global%20Intermediate%20wordlist%20with%20phonetics_fin.pdf');
addSourcedPhrase('under pressure','/ˌʌndə ˈpreʃə/',[
 ch('un','/ʌn/','secondary',[{letters:'u',sound:'/ʌ/'},{letters:'n',sound:'/n/'}]),
 ch('der ','/də/','none',[{letters:'d',sound:'/d/'},{letters:'e',sound:'/ə/'},{letters:'r',sound:''},{letters:' ',sound:''}]),
 ch('pre','/pre/','primary',[{letters:'p',sound:'/p/'},{letters:'r',sound:'/r/'},{letters:'e',sound:'/e/'}]),
 ch('ssure','/ʃə/','none',[{letters:'ss',sound:'/ʃ/'},{letters:'u',sound:'/ə/'},{letters:'re',sound:''}]),
],'Action for Kazakhstan Grade 10 词表','https://lib.kpvk.edu.kz/wp-content/uploads/2022/03/action-10-1.pdf');

const oxfordWordSkills='https://formanglais.com/wp-content/uploads/2020/03/pocket-guide-Word-Skills.pdf';
addSourcedPhrase('die out','/ˌdaɪ ˈaʊt/',[
 ch('die ','/daɪ/','secondary',[{letters:'d',sound:'/d/'},{letters:'ie',sound:'/aɪ/'},{letters:' ',sound:''}]),
 ch('out','/aʊt/','primary',[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('set off','/ˌset ˈɒf/',[
 ch('set ','/set/','secondary',[{letters:'s',sound:'/s/'},{letters:'e',sound:'/e/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}]),
 ch('off','/ɒf/','primary',[{letters:'o',sound:'/ɒ/'},{letters:'ff',sound:'/f/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('run out','/ˌrʌn ˈaʊt/',[
 ch('run ','/rʌn/','secondary',[{letters:'r',sound:'/r/'},{letters:'u',sound:'/ʌ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('out','/aʊt/','primary',[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('set out','/ˌset ˈaʊt/',[
 ch('set ','/set/','secondary',[{letters:'s',sound:'/s/'},{letters:'e',sound:'/e/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}]),
 ch('out','/aʊt/','primary',[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('break out','/ˌbreɪk ˈaʊt/',[
 ch('break ','/breɪk/','secondary',[{letters:'b',sound:'/b/'},{letters:'r',sound:'/r/'},{letters:'ea',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:' ',sound:''}]),
 ch('out','/aʊt/','primary',[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('on board','/ˌɒn ˈbɔːd/',[
 ch('on ','/ɒn/','secondary',[{letters:'o',sound:'/ɒ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('board','/bɔːd/','primary',[{letters:'b',sound:'/b/'},{letters:'oar',sound:'/ɔː/'},{letters:'d',sound:'/d/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('speak up','/ˌspiːk ˈʌp/',[
 ch('speak ','/spiːk/','secondary',[{letters:'s',sound:'/s/'},{letters:'p',sound:'/p/'},{letters:'ea',sound:'/iː/'},{letters:'k',sound:'/k/'},{letters:' ',sound:''}]),
 ch('up','/ʌp/','primary',[{letters:'u',sound:'/ʌ/'},{letters:'p',sound:'/p/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('turn out','/ˌtɜːn ˈaʊt/',[
 ch('turn ','/tɜːn/','secondary',[{letters:'t',sound:'/t/'},{letters:'ur',sound:'/ɜː/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('out','/aʊt/','primary',[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('after all','/ˌɑːftər ˈɔːl/',[
 ch('af','/ɑːf/','secondary',[{letters:'a',sound:'/ɑː/'},{letters:'f',sound:'/f/'}]),
 ch('ter ','/tər/','none',[{letters:'t',sound:'/t/'},{letters:'e',sound:'/ə/'},{letters:'r',sound:'/r/'},{letters:' ',sound:''}]),
 ch('all','/ɔːl/','primary',[{letters:'a',sound:'/ɔː/'},{letters:'ll',sound:'/l/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('to be honest','/tə bi ˈɒnɪst/',[
 ch('to ','/tə/','none',[{letters:'t',sound:'/t/'},{letters:'o',sound:'/ə/'},{letters:' ',sound:''}]),
 ch('be ','/bi/','none',[{letters:'b',sound:'/b/'},{letters:'e',sound:'/i/'},{letters:' ',sound:''}]),
 ch('hon','/ɒn/','primary',[{letters:'h',sound:''},{letters:'o',sound:'/ɒ/'},{letters:'n',sound:'/n/'}]),
 ch('est','/ɪst/','none',[{letters:'e',sound:'/ɪ/'},{letters:'s',sound:'/s/'},{letters:'t',sound:'/t/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('as a result','/əz ə rɪˈzʌlt/',[
 ch('as ','/əz/','none',[{letters:'a',sound:'/ə/'},{letters:'s',sound:'/z/'},{letters:' ',sound:''}]),
 ch('a ','/ə/','none',[{letters:'a',sound:'/ə/'},{letters:' ',sound:''}]),
 ch('re','/rɪ/','none',[{letters:'r',sound:'/r/'},{letters:'e',sound:'/ɪ/'}]),
 ch('sult','/zʌlt/','primary',[{letters:'s',sound:'/z/'},{letters:'u',sound:'/ʌ/'},{letters:'l',sound:'/l/'},{letters:'t',sound:'/t/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('keep in touch','/ˌkiːp ɪn ˈtʌtʃ/',[
 ch('keep ','/kiːp/','secondary',[{letters:'k',sound:'/k/'},{letters:'ee',sound:'/iː/'},{letters:'p',sound:'/p/'},{letters:' ',sound:''}]),
 ch('in ','/ɪn/','none',[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('touch','/tʌtʃ/','primary',[{letters:'t',sound:'/t/'},{letters:'ou',sound:'/ʌ/'},{letters:'ch',sound:'/tʃ/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('out of shape','/ˌaʊt əv ˈʃeɪp/',[
 ch('out ','/aʊt/','secondary',[{letters:'ou',sound:'/aʊ/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}]),
 ch('of ','/əv/','none',[{letters:'o',sound:'/ə/'},{letters:'f',sound:'/v/'},{letters:' ',sound:''}]),
 ch('shape','/ʃeɪp/','primary',[{letters:'sh',sound:'/ʃ/'},{letters:'a',sound:'/eɪ/'},{letters:'p',sound:'/p/'},{letters:'e',sound:''}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('pros and cons','/ˌprəʊz ənd ˈkɒns/',[
 ch('pros ','/prəʊz/','secondary',[{letters:'p',sound:'/p/'},{letters:'r',sound:'/r/'},{letters:'o',sound:'/əʊ/'},{letters:'s',sound:'/z/'},{letters:' ',sound:''}]),
 ch('and ','/ənd/','none',[{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:'d',sound:'/d/'},{letters:' ',sound:''}]),
 ch('cons','/kɒns/','primary',[{letters:'c',sound:'/k/'},{letters:'o',sound:'/ɒ/'},{letters:'n',sound:'/n/'},{letters:'s',sound:'/s/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('in addition','/ˌɪn əˈdɪʃn/',[
 ch('in ','/ɪn/','secondary',[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('ad','/ə/','none',[{letters:'a',sound:'/ə/'},{letters:'d',sound:''}]),
 ch('di','/dɪ/','primary',[{letters:'d',sound:'/d/'},{letters:'i',sound:'/ɪ/'}]),
 ch('tion','/ʃn/','none',[{letters:'tion',sound:'/ʃn/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('in other words','/ɪn ˈʌðə wɜːdz/',[
 ch('in ','/ɪn/','none',[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('o','/ʌ/','primary',[{letters:'o',sound:'/ʌ/'}]),
 ch('ther ','/ðə/','none',[{letters:'th',sound:'/ð/'},{letters:'e',sound:'/ə/'},{letters:'r',sound:''},{letters:' ',sound:''}]),
 ch('words','/wɜːdz/','none',[{letters:'w',sound:'/w/'},{letters:'or',sound:'/ɜː/'},{letters:'d',sound:'/d/'},{letters:'s',sound:'/z/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('set an example','/ˌset ən ɪɡˈzɑːmpl/',[
 ch('set ','/set/','secondary',[{letters:'s',sound:'/s/'},{letters:'e',sound:'/e/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}]),
 ch('an ','/ən/','none',[{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('e','/ɪ/','none',[{letters:'e',sound:'/ɪ/'}]),
 {...ch('xam','/ɡzɑːm/','primary',[{letters:'x',sound:'/ɡz/'},{letters:'a',sound:'/ɑː/'},{letters:'m',sound:'/m/'}]),crossesStressBoundary:true},
 ch('ple','/pl/','none',[{letters:'p',sound:'/p/'},{letters:'le',sound:'/l/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
addSourcedPhrase('in response to','/ɪn rɪˈspɒns tə/',[
 ch('in ','/ɪn/','none',[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}]),
 ch('re','/rɪ/','none',[{letters:'r',sound:'/r/'},{letters:'e',sound:'/ɪ/'}]),
 ch('sponse ','/spɒns/','primary',[{letters:'s',sound:'/s/'},{letters:'p',sound:'/p/'},{letters:'o',sound:'/ɒ/'},{letters:'n',sound:'/n/'},{letters:'s',sound:'/s/'},{letters:'e',sound:''},{letters:' ',sound:''}]),
 ch('to','/tə/','none',[{letters:'t',sound:'/t/'},{letters:'o',sound:'/ə/'}]),
],'Oxford Learner’s Pocket Word Skills 词表',oxfordWordSkills);
