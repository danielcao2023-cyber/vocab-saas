import type {SoundSpellingLesson} from './types';

/** These initialisms are conventionally pronounced as words, not letter by letter. */
export const highschoolFifaNasaVerified: SoundSpellingLesson[] = [
 {headword:'FIFA',ipa:'/ˈfiːfə/',uk:'/ˈfiːfə/',chunks:[
  {letters:'FI',sound:'/fiː/',stress:'primary',hint:'第一部分重读。',pairs:[{letters:'F',sound:'/f/'},{letters:'I',sound:'/iː/'}],tip:'此缩写按词读，FI 读 /fiː/。'},
  {letters:'FA',sound:'/fə/',stress:'none',hint:'第二部分轻读。',pairs:[{letters:'F',sound:'/f/'},{letters:'A',sound:'/ə/'}],tip:'末尾 A 轻读 /ə/。'}],
  anchor:{text:'FIFA 是按词读的缩写，重音在第一部分。'},variantNote:'这是该缩写的惯用读法，并不代表所有字母缩写都这样读。',sources:[{label:'Cambridge Dictionary · FIFA 发音',url:'https://dictionary.cambridge.org/pronunciation/english/fifa'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex spelling-sound alignment'}},
 {headword:'NASA',ipa:'/ˈnæsə/',uk:'/ˈnæsə/',chunks:[
  {letters:'NAS',sound:'/næs/',stress:'primary',hint:'第一部分重读。',pairs:[{letters:'N',sound:'/n/'},{letters:'A',sound:'/æ/'},{letters:'S',sound:'/s/'}],tip:'此缩写按词读，NAS 读 /næs/。'},
  {letters:'A',sound:'/ə/',stress:'none',hint:'第二部分轻读。',pairs:[{letters:'A',sound:'/ə/'}],tip:'末尾 A 轻读 /ə/。'}],
  anchor:{text:'NASA 是按词读的缩写，重音在第一部分。'},variantNote:'这是该缩写的惯用读法，并不代表所有字母缩写都这样读。',sources:[{label:'Cambridge Dictionary · NASA 发音',url:'https://dictionary.cambridge.org/pronunciation/english/nasa'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex spelling-sound alignment'}}
];
