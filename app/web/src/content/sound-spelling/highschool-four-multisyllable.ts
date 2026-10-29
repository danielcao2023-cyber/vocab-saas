import type {SoundSpellingLesson} from './types';

// 块用于展示拼写与音素对应，不声称都是唯一的音节切分。
export const highschoolFourMultisyllable: SoundSpellingLesson[] = [
 {
  headword:'thanksgiving',ipa:'/ˌθæŋksˈɡɪvɪŋ/',uk:'/ˌθæŋksˈɡɪvɪŋ/',
  chunks:[
   {letters:'thanks',sound:'/ˌθæŋks/',stress:'secondary',hint:'次重音。',pairs:[{letters:'th',sound:'/θ/'},{letters:'a',sound:'/æ/'},{letters:'n',sound:'/ŋ/'},{letters:'k',sound:'/k/'},{letters:'s',sound:'/s/'}],tip:'th 对应 /θ/；n 在 k 前读 /ŋ/。'},
   {letters:'giv',sound:'/ˈɡɪv/',stress:'primary',hint:'主重音。',pairs:[{letters:'g',sound:'/ɡ/'},{letters:'i',sound:'/ɪ/'},{letters:'v',sound:'/v/'}],tip:'重音落在 giv。'},
   {letters:'ing',sound:'/ɪŋ/',stress:'none',hint:'轻读。',pairs:[{letters:'i',sound:'/ɪ/'},{letters:'ng',sound:'/ŋ/'}],tip:'ing 末尾的 ng 对应 /ŋ/。'}
  ],anchor:{text:'Thanksgiving：按 thanks + giving 两个部分记拼写。'},variantNote:'采用剑桥所列英美共同音标；拼写中的感恩节首字母大写。',sources:[{label:'Cambridge Dictionary · Thanksgiving',url:'https://dictionary.cambridge.org/pronunciation/english/thanksgiving'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
 },
 {
  headword:'café',ipa:'/kæfˈeɪ/',uk:'/ˈkæfeɪ/',
  chunks:[
   {letters:'caf',sound:'/kæf/',stress:'none',hint:'美式读法中此部分不重读。',pairs:[{letters:'c',sound:'/k/'},{letters:'a',sound:'/æ/'},{letters:'f',sound:'/f/'}],tip:'c 对应 /k/，a 对应 /æ/。'},
   {letters:'é',sound:'/ˈeɪ/',stress:'primary',hint:'美式读法主重音。',pairs:[{letters:'é',sound:'/eɪ/'}],tip:'末尾 é 对应 /eɪ/。'}
  ],anchor:{text:'café：两个部分连读，注意末尾 é。'},variantNote:'按剑桥所列美式读法，重音在末尾；其英式读法重音在开头。',sources:[{label:'Cambridge Dictionary · café',url:'https://dictionary.cambridge.org/pronunciation/english/cafe'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
 },
 {
  headword:'hip-hop',ipa:'/ˈhɪphɑːp/',uk:'/ˈhɪphɒp/',
  chunks:[
   {letters:'hip-',sound:'/ˈhɪp/',stress:'primary',hint:'主重音。',pairs:[{letters:'h',sound:'/h/'},{letters:'i',sound:'/ɪ/'},{letters:'p',sound:'/p/'},{letters:'-',sound:''}],tip:'连字符不单独发音。'},
   {letters:'hop',sound:'/hɑːp/',stress:'none',hint:'第二部分。',pairs:[{letters:'h',sound:'/h/'},{letters:'o',sound:'/ɑː/'},{letters:'p',sound:'/p/'}],tip:'此美式读法中 o 对应 /ɑː/。'}
  ],anchor:{text:'hip-hop：按 hip + hop 记住连字符拼法。'},variantNote:'按剑桥所列美式读法；英式第二部分元音可读 /ɒ/。',sources:[{label:'Cambridge Dictionary · hip-hop',url:'https://dictionary.cambridge.org/pronunciation/english/hip-hop'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
 },
 {
  headword:'anglo-saxon',ipa:'/ˌæŋɡloʊˈsæksən/',uk:'/ˌæŋɡləʊˈsæksən/',
  chunks:[
   {letters:'ang',sound:'/ˌæŋɡ/',stress:'secondary',hint:'次重音。',pairs:[{letters:'a',sound:'/æ/'},{letters:'n',sound:'/ŋ/'},{letters:'g',sound:'/ɡ/'}],tip:'n 在 g 前读 /ŋ/，g 对应 /ɡ/。'},
   {letters:'lo-',sound:'/loʊ/',stress:'none',hint:'轻读部分。',pairs:[{letters:'l',sound:'/l/'},{letters:'o',sound:'/oʊ/'},{letters:'-',sound:''}],tip:'此美式读法中 o 对应 /oʊ/；连字符不发音。'},
   {letters:'sax',sound:'/ˈsæks/',stress:'primary',hint:'主重音。',pairs:[{letters:'s',sound:'/s/'},{letters:'a',sound:'/æ/'},{letters:'x',sound:'/ks/'}],tip:'x 对应 /ks/。'},
   {letters:'on',sound:'/ən/',stress:'none',hint:'末尾轻读。',pairs:[{letters:'o',sound:'/ə/'},{letters:'n',sound:'/n/'}],tip:'末尾 o 弱读为 /ə/。'}
  ],anchor:{text:'Anglo-Saxon：记住 Anglo 和 Saxon 之间的连字符及大写。'},variantNote:'采用剑桥所列美式读法；英式 Anglo 的 o 读 /əʊ/。分块仅用于对应字母和音素。',sources:[{label:'Cambridge Dictionary · Anglo-Saxon',url:'https://dictionary.cambridge.org/pronunciation/english/anglo-saxon'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
 }
];
