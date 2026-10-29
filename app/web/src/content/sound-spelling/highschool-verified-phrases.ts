import type {SoundSpellingLesson} from './types';

// IPA and stress follow the cited word lists; connected-speech stress can vary.
export const highschoolVerifiedPhrases: SoundSpellingLesson[] = [
 {
  headword:'to be frank',ipa:'/tə bɪ ˈfræŋk/',uk:'/tə bɪ ˈfræŋk/',
  chunks:[
   {letters:'to ',sound:'/tə/',stress:'none',hint:'to 轻读。',pairs:[{letters:'t',sound:'/t/'},{letters:'o',sound:'/ə/'},{letters:' ',sound:''}],tip:'实际语流中弱读可能变化。'},
   {letters:'be ',sound:'/bɪ/',stress:'none',hint:'be 在此读轻音。',pairs:[{letters:'b',sound:'/b/'},{letters:'e',sound:'/ɪ/'},{letters:' ',sound:''}],tip:'结合语境练读。'},
   {letters:'frank',sound:'/fræŋk/',stress:'primary',hint:'frank 重读。',pairs:[{letters:'f',sound:'/f/'},{letters:'r',sound:'/r/'},{letters:'a',sound:'/æ/'},{letters:'n',sound:'/ŋ/'},{letters:'k',sound:'/k/'}],tip:'n 在 k 前读 /ŋ/。'},
  ],
  anchor:{text:'先轻读 to be，再清楚读出 frank。'},
  variantNote:'这里展示词表中的英式读法；实际语流的重音和弱读可能变化。',
  sources:[{label:'Pearson New Success Upper Intermediate 词表',url:'https://www.venturesbooks.sk/component/phocadownload/category/132-new-success?download=1562%3Anewsuccess-upp-final'}],
  review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; phrase pronunciation checked against textbook wordlist'},
 },
];

highschoolVerifiedPhrases.push({
 headword:'in the open air',ipa:'/ɪn ði ˌəʊpn ˈeə/',uk:'/ɪn ði ˌəʊpn ˈeə/',
 chunks:[
  {letters:'in ',sound:'/ɪn/',stress:'none',hint:'先读 in。',pairs:[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}],tip:'放回句中体会连读。'},
  {letters:'the ',sound:'/ði/',stress:'none',hint:'the 在元音前读 /ði/。',pairs:[{letters:'th',sound:'/ð/'},{letters:'e',sound:'/i/'},{letters:' ',sound:''}],tip:'实际语流的重音和弱读可能变化。'},
  {letters:'o',sound:'/əʊ/',stress:'secondary',hint:'open 的开头标次重音。',pairs:[{letters:'o',sound:'/əʊ/'}],tip:'这里采用词表中的英式读法。'},
  {letters:'pen ',sound:'/pn/',stress:'none',hint:'末尾 n 构成一个轻读音节。',pairs:[{letters:'p',sound:'/p/'},{letters:'e',sound:''},{letters:'n',sound:'/n/'},{letters:' ',sound:''}],tip:'这是词表所示的音节辅音读法，也可能听到 /pən/。'},
  {letters:'air',sound:'/eə/',stress:'primary',hint:'air 重读。',pairs:[{letters:'air',sound:'/eə/'}],tip:'这里展示非卷舌英音。'},
 ],
 anchor:{text:'先读 in the，再连接 open air。'},
 variantNote:'这里展示词表中的一种英式读法；实际语流中的元音、重音和连读可能变化。',
 sources:[{label:'Klett Freeway Soziales 词表',url:'https://www2.klett.de/sixcms/media.php/229/Wortschatz_Freeway_Soziales_GWSgekennzeichnet.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against textbook wordlist'},
});

highschoolVerifiedPhrases.push({
 headword:'roast turkey',ipa:'/ˌrəʊst ˈtɜːki/',uk:'/ˌrəʊst ˈtɜːki/',
 chunks:[
  {letters:'roast ',sound:'/rəʊst/',stress:'secondary',hint:'roast 标次重音。',pairs:[{letters:'r',sound:'/r/'},{letters:'oa',sound:'/əʊ/'},{letters:'s',sound:'/s/'},{letters:'t',sound:'/t/'},{letters:' ',sound:''}],tip:'oa 在这里读 /əʊ/。'},
  {letters:'tur',sound:'/tɜː/',stress:'primary',hint:'tur 是重读音节。',pairs:[{letters:'t',sound:'/t/'},{letters:'ur',sound:'/ɜː/'}],tip:'这里展示非卷舌英音。'},
  {letters:'key',sound:'/ki/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'k',sound:'/k/'},{letters:'ey',sound:'/i/'}],tip:'结合整组练读。'},
 ],
 anchor:{text:'先读 roast，再重读 turkey 的开头。'},
 variantNote:'这里展示词表中的英式非卷舌读法；实际重音和口音可能变化。',
 sources:[{label:'English Walker 教材词表',url:'https://mybook.dniprorada.gov.ua/uploads/8bd1ad0eb8854187a0984b58d2fc77a45englishwalker2022.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against textbook wordlist'},
});

highschoolVerifiedPhrases.push({
 headword:'date back',ipa:'/deɪt ˈbæk/',uk:'/deɪt ˈbæk/',
 chunks:[
  {letters:'date ',sound:'/deɪt/',stress:'none',hint:'先读 date。',pairs:[{letters:'d',sound:'/d/'},{letters:'a',sound:'/eɪ/'},{letters:'t',sound:'/t/'},{letters:'e',sound:''},{letters:' ',sound:''}],tip:'词尾 e 不单独发音。'},
  {letters:'back',sound:'/bæk/',stress:'primary',hint:'back 重读。',pairs:[{letters:'b',sound:'/b/'},{letters:'a',sound:'/æ/'},{letters:'ck',sound:'/k/'}],tip:'ck 合起来读 /k/。'},
 ],
 anchor:{text:'date back 常接 to 加时间，一起放回句子练读。'},
 variantNote:'这里展示词表对 date back (to) 的英式读法；句中重音可能变化。',
 sources:[{label:'National Geographic Learning Close-up B1+ 词表',url:'https://www.bridgebooks.cz/out/media/NCU%20B1plus%20Unit%206.pdf'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; pronunciation checked against textbook wordlist'},
});
