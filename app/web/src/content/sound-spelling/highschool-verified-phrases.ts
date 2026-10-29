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
