import type {SoundSpellingLesson} from './types';
// The dictionary gives /aɪən/ without a syllable boundary; keep the irregular
// spelling together rather than asserting a dictionary syllabification.
export const highschoolIron: SoundSpellingLesson[] = [{
 headword:'iron',ipa:'/aɪən/',uk:'/aɪən/',
 chunks:[{letters:'iron',sound:'/aɪən/',stress:'primary',hint:'整词对照。',pairs:[{letters:'i',sound:'/aɪ/'},{letters:'r',sound:''},{letters:'o',sound:'/ə/'},{letters:'n',sound:'/n/'}],tip:'在这里的英式读法中，r 不单独发音；o 对应弱读 /ə/。'}],
 anchor:{text:'iron：按整词读音 /aɪən/ 记忆，不要按字母顺序读出 /r/。'},
 variantNote:'此处采用剑桥词典所列英式读法；美式发音带 r 音。不同说话者的音节划分可有差别；录音口音未在本次核验。',
 sources:[{label:'Cambridge Dictionary · iron pronunciation',url:'https://dictionary.cambridge.org/pronunciation/english/iron'}],
 review:{status:'reviewed',reviewedAt:'2026-10-30',draftedBy:'Codex dictionary-backed alignment'}
}];
