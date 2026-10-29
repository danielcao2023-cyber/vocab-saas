import type {SoundSpellingLesson} from './types';
export const highschoolLeonardo: SoundSpellingLesson[] = [{
 headword:'Leonardo da Vinci', ipa:'/ˌliːəˈnɑːdəʊ də ˈvɪntʃɪ/', uk:'/ˌliːəˈnɑːdəʊ də ˈvɪntʃɪ/',
 chunks:[
  {letters:'Leo',sound:'/ˌliːə/',stress:'secondary',hint:'次重读。',pairs:[{letters:'L',sound:'/l/'},{letters:'e',sound:'/iː/'},{letters:'o',sound:'/ə/'}],tip:'按词典中的英语读法记住 Leo。'},
  {letters:'nar',sound:'/ˈnɑː/',stress:'primary',hint:'此部分重读。',pairs:[{letters:'n',sound:'/n/'},{letters:'a',sound:'/ɑː/'},{letters:'r',sound:''}],tip:'该英式读法中 r 不单独发音。'},
  {letters:'do ',sound:'/dəʊ/',stress:'none',hint:'此部分轻读。',pairs:[{letters:'d',sound:'/d/'},{letters:'o',sound:'/əʊ/'},{letters:' ',sound:''}],tip:'空格不发音。'},
  {letters:'da ',sound:'/də/',stress:'none',hint:'弱读。',pairs:[{letters:'d',sound:'/d/'},{letters:'a',sound:'/ə/'},{letters:' ',sound:''}],tip:'da 弱读为 /də/。'},
  {letters:'Vinci',sound:'/ˈvɪntʃɪ/',stress:'primary',hint:'姓氏部分重读。',pairs:[{letters:'V',sound:'/v/'},{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'},{letters:'c',sound:'/tʃ/'},{letters:'i',sound:'/ɪ/'}],tip:'此词典读法中 c 对应 /tʃ/。'}
 ],
 anchor:{text:'达·芬奇：结合完整姓名的英语读法记忆拼写。'},
 variantNote:'这里采用 Collins 所列英式英语读法；美式英语、意大利语或其他词典读法可能不同。现有录音与此音标尚未试听核对。',
 sources:[{label:'Collins · Leonardo da Vinci (British English)',url:'https://www.collinsdictionary.com/dictionary/english/leonardo-da-vinci'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
}];
