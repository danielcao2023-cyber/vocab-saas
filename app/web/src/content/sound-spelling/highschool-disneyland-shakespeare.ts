import type {SoundSpellingLesson} from './types';

export const highschoolDisneylandShakespeare: SoundSpellingLesson[] = [
 {
  headword:'Disneyland',ipa:'/ˈdɪznilænd/',uk:'/ˈdɪznilænd/',
  chunks:[
   {letters:'Dis',sound:'/dɪz/',stress:'primary',hint:'第一部分重读。',pairs:[{letters:'D',sound:'/d/'},{letters:'i',sound:'/ɪ/'},{letters:'s',sound:'/z/'}],tip:'此处 s 对应 /z/。'},
   {letters:'ney',sound:'/ni/',stress:'none',hint:'中间部分轻读。',pairs:[{letters:'n',sound:'/n/'},{letters:'ey',sound:'/i/'}],tip:'ey 对应 /i/。'},
   {letters:'land',sound:'/lænd/',stress:'none',hint:'词尾按词典音标读。',pairs:[{letters:'l',sound:'/l/'},{letters:'a',sound:'/æ/'},{letters:'n',sound:'/n/'},{letters:'d',sound:'/d/'}],tip:'land 中 a 对应 /æ/。'}
  ],anchor:{text:'重音在第一部分，注意 Disney 中 s 对应 /z/。'},variantNote:'此处采用剑桥词典列出的英美音标；实际说话节奏和重音可有差异。',sources:[{label:'Cambridge Dictionary · Disneyland 英语读音',url:'https://dictionary.cambridge.org/pronunciation/english/disneyland'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex dictionary-based spelling alignment'}
 },
 {
  headword:'Shakespeare',ipa:'/ˈʃeɪkspɪr/',uk:'/ˈʃeɪkspɪə/',
  chunks:[
   {letters:'Shake',sound:'/ʃeɪk/',stress:'primary',hint:'第一部分重读。',pairs:[{letters:'Sh',sound:'/ʃ/'},{letters:'a',sound:'/eɪ/'},{letters:'k',sound:'/k/'},{letters:'e',sound:''}],tip:'此处 a 与末尾 e 对应 /eɪ/；末尾 e 不单独发音。'},
   {letters:'speare',sound:'/spɪr/',stress:'none',hint:'美式第二部分轻读。',pairs:[{letters:'s',sound:'/s/'},{letters:'p',sound:'/p/'},{letters:'ear',sound:'/ɪr/'},{letters:'e',sound:''}],tip:'美式 ear 对应 /ɪr/；最后的 e 不单独发音。'}
  ],anchor:{text:'莎士比亚：第一部分重读，注意两个 e 不单独发音。'},variantNote:'上方分段按美式 /ˈʃeɪkspɪr/；剑桥所列英式 /ˈʃeɪkspɪə/ 的词尾通常不卷舌。',sources:[{label:'Cambridge Dictionary · Shakespeare 英语读音',url:'https://dictionary.cambridge.org/pronunciation/english/shakespeare'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex dictionary-based spelling alignment'}
 }
];
