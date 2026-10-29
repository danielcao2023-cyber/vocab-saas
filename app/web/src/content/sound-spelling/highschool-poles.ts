import type {SoundSpellingLesson} from './types';
export const highschoolPoles: SoundSpellingLesson[] = [{
 headword:'the North Pole',ipa:'/ðə ˌnɔːθ ˈpəʊl/',uk:'/ðə ˌnɔːθ ˈpəʊl/',
 chunks:[
  {letters:'the ',sound:'/ðə /',stress:'none',hint:'冠词轻读。',pairs:[{letters:'th',sound:'/ð/'},{letters:'e',sound:'/ə/'},{letters:' ',sound:''}],tip:'the 在辅音音素前通常弱读 /ðə/。'},
  {letters:'North ',sound:'/ˌnɔːθ /',stress:'secondary',hint:'次重读。',pairs:[{letters:'N',sound:'/n/'},{letters:'o',sound:'/ɔː/'},{letters:'r',sound:''},{letters:'th',sound:'/θ/'},{letters:' ',sound:''}],tip:'此英式读法中 r 不单独发音。'},
  {letters:'Pole',sound:'/ˈpəʊl/',stress:'primary',hint:'主要重音。',pairs:[{letters:'P',sound:'/p/'},{letters:'o',sound:'/əʊ/'},{letters:'l',sound:'/l/'},{letters:'e',sound:''}],tip:'末尾 e 不单独发音。'}
 ],anchor:{text:'北极：按 the + North + Pole 记住完整名称。'},variantNote:'这里采用牛津词典所列英式读法；美式 North 常带 r 音。现有录音尚未试听核对。',
 sources:[{label:'Oxford Learner’s Dictionaries · the North Pole',url:'https://www.oxfordlearnersdictionaries.com/definition/english/the-north-pole'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
},{
 headword:'the South Pole',ipa:'/ðə ˌsaʊθ ˈpəʊl/',uk:'/ðə ˌsaʊθ ˈpəʊl/',
 chunks:[
  {letters:'the ',sound:'/ðə /',stress:'none',hint:'冠词轻读。',pairs:[{letters:'th',sound:'/ð/'},{letters:'e',sound:'/ə/'},{letters:' ',sound:''}],tip:'the 在辅音音素前通常弱读 /ðə/。'},
  {letters:'South ',sound:'/ˌsaʊθ /',stress:'secondary',hint:'次重读。',pairs:[{letters:'S',sound:'/s/'},{letters:'ou',sound:'/aʊ/'},{letters:'th',sound:'/θ/'},{letters:' ',sound:''}],tip:'ou 对应 /aʊ/。'},
  {letters:'Pole',sound:'/ˈpəʊl/',stress:'primary',hint:'主要重音。',pairs:[{letters:'P',sound:'/p/'},{letters:'o',sound:'/əʊ/'},{letters:'l',sound:'/l/'},{letters:'e',sound:''}],tip:'末尾 e 不单独发音。'}
 ],anchor:{text:'南极点：按 the + South + Pole 记住完整名称。'},variantNote:'这里采用牛津词典列出的词组读法；其他口音及自然语流可能不同。现有录音尚未试听核对。',
 sources:[{label:'Oxford Learner’s Dictionaries · the South Pole',url:'https://www.oxfordlearnersdictionaries.com/definition/english/the-south-pole'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
}];
