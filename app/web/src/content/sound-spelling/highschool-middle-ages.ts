import type {SoundSpellingLesson} from './types';
export const highschoolMiddleAges: SoundSpellingLesson[] = [{
 headword:'The Middle Ages',ipa:'/ðə ˌmɪdl ˈeɪdʒɪz/',uk:'/ðə ˌmɪdl ˈeɪdʒɪz/',
 chunks:[
  {letters:'The ',sound:'/ðə /',stress:'none',hint:'冠词轻读。',pairs:[{letters:'Th',sound:'/ð/'},{letters:'e',sound:'/ə/'},{letters:' ',sound:''}],tip:'在辅音音素 /m/ 前，the 通常弱读 /ðə/。'},
  {letters:'Middle ',sound:'/ˌmɪdl /',stress:'secondary',hint:'次重读。',pairs:[{letters:'M',sound:'/m/'},{letters:'i',sound:'/ɪ/'},{letters:'dd',sound:'/d/'},{letters:'l',sound:'/l/'},{letters:'e',sound:''},{letters:' ',sound:''}],tip:'dd 对应一个 /d/，末尾 e 不单独发音。'},
  {letters:'Ages',sound:'/ˈeɪdʒɪz/',stress:'primary',hint:'主要重音。',pairs:[{letters:'A',sound:'/eɪ/'},{letters:'g',sound:'/dʒ/'},{letters:'e',sound:'/ɪ/'},{letters:'s',sound:'/z/'}],tip:'末尾 es 在这个读法中对应 /ɪz/。'}
 ],
 anchor:{text:'中世纪：先听完整词组，再按 The + Middle + Ages 记住拼写。'},
 variantNote:'这里采用牛津词典的完整词组音标；其他词典或自然语流中的重音、音节标注可能不同。现有录音尚未试听核对。',
 sources:[{label:'Oxford Learner’s Dictionaries · the Middle Ages',url:'https://www.oxfordlearnersdictionaries.com/definition/english/the-middle-ages'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
}];
