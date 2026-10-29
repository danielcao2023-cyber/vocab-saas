import type {SoundSpellingLesson} from './types';

export const highschoolHonorVerified: SoundSpellingLesson[] = [{
 headword:'honor',ipa:'/ˈɑːnɚ/',chunks:[
  {letters:'ho',sound:'/ɑː/',stress:'primary',hint:'第一部分重读，h 不发音。',pairs:[{letters:'h',sound:''},{letters:'o',sound:'/ɑː/'}],tip:'拼写时保留不发音的 h。'},
  {letters:'nor',sound:'/nɚ/',stress:'none',hint:'第二部分轻读。',pairs:[{letters:'n',sound:'/n/'},{letters:'or',sound:'/ɚ/'}],tip:'美式读音中 or 对应 /ɚ/。'}],
 anchor:{text:'honor 是美式拼写，h 不发音。'},variantNote:'采用剑桥词典所列美式读音；英式常用拼写 honour。',
 sources:[{label:'Cambridge Dictionary · honor 发音',url:'https://dictionary.cambridge.org/pronunciation/english/honor'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex spelling-sound alignment'}
}];
