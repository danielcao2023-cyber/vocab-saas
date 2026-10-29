import type {SoundSpellingLesson} from './types';

// These one-syllable forms complete mixed headwords alongside hostess and princess.
export const highschoolHostPrince: SoundSpellingLesson[] = [{
 headword:'host',ipa:'/həʊst/',uk:'/həʊst/',
 chunks:[{letters:'host',sound:'/həʊst/',stress:'primary',hint:'一个音节。',pairs:[{letters:'h',sound:'/h/'},{letters:'o',sound:'/əʊ/'},{letters:'s',sound:'/s/'},{letters:'t',sound:'/t/'}],tip:'o 在这里对应英式 /əʊ/，最后的 st 两个音都要读出。'}],
 anchor:{text:'host 是主人、东道主，也可表示主持人。'},
 variantNote:'这里采用英式发音；美式的 o 通常读 /oʊ/。',
 sources:[{label:'Cambridge Dictionary · host',url:'https://dictionary.cambridge.org/pronunciation/english/host'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
},{
 headword:'prince',ipa:'/prɪns/',uk:'/prɪns/',
 chunks:[{letters:'prince',sound:'/prɪns/',stress:'primary',hint:'一个音节。',pairs:[{letters:'p',sound:'/p/'},{letters:'r',sound:'/r/'},{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:'c',sound:'/s/'},{letters:'e',sound:''}],tip:'c 在 e 前读 /s/，词尾 e 不单独发音。'}],
 anchor:{text:'prince 是王子或亲王。'},
 variantNote:'剑桥词典所列英式和美式音标相同。',
 sources:[{label:'Cambridge Dictionary · prince',url:'https://dictionary.cambridge.org/pronunciation/english/prince'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
}];
