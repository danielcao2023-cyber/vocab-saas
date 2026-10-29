import type {SoundSpellingLesson} from './types';

/** 字母缩写按字母名称朗读，而非将字母当作普通单词的拼读音。 */
export const highschoolLetterNames: SoundSpellingLesson[] = [
 {
  headword:'GPS',ipa:'/ˌdʒiː piː ˈes/',uk:'/ˌdʒiː piː ˈes/',
  chunks:[
   {letters:'G',sound:'/ˌdʒiː/',stress:'secondary',hint:'第一个字母次重读。',pairs:[{letters:'G',sound:'/dʒiː/'}],tip:'读字母 G 的名称。'},
   {letters:'P',sound:'/piː/',stress:'none',hint:'第二个字母。',pairs:[{letters:'P',sound:'/piː/'}],tip:'读字母 P 的名称。'},
   {letters:'S',sound:'/ˈes/',stress:'primary',hint:'最后一个字母主要重读。',pairs:[{letters:'S',sound:'/es/'}],tip:'读字母 S 的名称。'}
  ],anchor:{text:'全球定位系统：按 G、P、S 的顺序记住三个字母。'},
  variantNote:'这是字母名称的读法，不是 G、P、S 在普通单词中的固定拼读规则；句中重音可能变化。',
  sources:[{label:'Cambridge Dictionary · GPS',url:'https://dictionary.cambridge.org/pronunciation/english/gps'}],
  review:{status:'reviewed',reviewedAt:'2026-10-30',draftedBy:'Codex letter-name alignment'}
 },
 {
  headword:'CPR',ipa:'/ˌsiː piː ˈɑːr/',uk:'/ˌsiː piː ˈɑː/',
  chunks:[
   {letters:'C',sound:'/ˌsiː/',stress:'secondary',hint:'第一个字母次重读。',pairs:[{letters:'C',sound:'/siː/'}],tip:'读字母 C 的名称。'},
   {letters:'P',sound:'/piː/',stress:'none',hint:'第二个字母。',pairs:[{letters:'P',sound:'/piː/'}],tip:'读字母 P 的名称。'},
   {letters:'R',sound:'/ˈɑːr/',stress:'primary',hint:'最后一个字母主要重读。',pairs:[{letters:'R',sound:'/ɑːr/'}],tip:'美式读法中，字母 R 的名称带 /r/ 音。'}
  ],anchor:{text:'心肺复苏术：按 C、P、R 的顺序记住三个字母。'},
  variantNote:'这是字母名称的读法，不是普通单词的拼读规则。此处以美式为主，R 带 /r/ 音；英式单独读字母时常为 /ɑː/。句中重音和连读可能变化。',
  sources:[{label:'Cambridge Dictionary · CPR',url:'https://dictionary.cambridge.org/pronunciation/english/cpr'}],
  review:{status:'reviewed',reviewedAt:'2026-10-30',draftedBy:'Codex letter-name alignment'}
 }
];
