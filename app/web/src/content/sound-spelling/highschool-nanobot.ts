import type {SoundSpellingLesson} from './types';

export const highschoolNanobot: SoundSpellingLesson = {
 headword:'nanobot',ipa:'/ˈnænəʊbɒt/',uk:'/ˈnænəʊbɒt/',
 chunks:[
  {letters:'nan',sound:'/næn/',stress:'primary',hint:'开头 nan 重读。',pairs:[{letters:'n',sound:'/n/'},{letters:'a',sound:'/æ/'},{letters:'n',sound:'/n/'}],tip:'a 读短元音 /æ/。'},
  {letters:'o',sound:'/əʊ/',stress:'none',hint:'o 在此读 /əʊ/。',pairs:[{letters:'o',sound:'/əʊ/'}],tip:'这里采用英式读法。'},
  {letters:'bot',sound:'/bɒt/',stress:'none',hint:'末尾 bot 轻读。',pairs:[{letters:'b',sound:'/b/'},{letters:'o',sound:'/ɒ/'},{letters:'t',sound:'/t/'}],tip:'这里采用英式 /ɒ/；美式常见 /ɑː/。'},
 ],
 anchor:{text:'先重读 nan，再连着读 o 和 bot。'},
 variantNote:'这里展示词典列出的英式读法；不同口音的元音可能不同。',
 sources:[{label:'Oxford Learner’s Dictionaries · nanobot',url:'https://www.oxfordlearnersdictionaries.com/definition/english/nanobot'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex; British pronunciation checked against Oxford Learner’s Dictionaries'},
};
