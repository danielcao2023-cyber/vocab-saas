import type {SoundSpellingLesson} from './types';
export const highschoolSanLas: SoundSpellingLesson[] = [{
 headword:'San Francisco',ipa:'/ˌsæn frənˈsɪskəʊ/',uk:'/ˌsæn frənˈsɪskəʊ/',
 chunks:[
  {letters:'San ',sound:'/ˌsæn /',stress:'secondary',hint:'次重读。',pairs:[{letters:'S',sound:'/s/'},{letters:'a',sound:'/æ/'},{letters:'n',sound:'/n/'},{letters:' ',sound:''}],tip:'a 在此对应 /æ/。'},
  {letters:'Fran',sound:'/frən/',stress:'none',hint:'此部分轻读。',pairs:[{letters:'F',sound:'/f/'},{letters:'r',sound:'/r/'},{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'}],tip:'a 在此弱读 /ə/。'},
  {letters:'cis',sound:'/ˈsɪs/',stress:'primary',hint:'主要重音。',pairs:[{letters:'c',sound:'/s/'},{letters:'i',sound:'/ɪ/'},{letters:'s',sound:'/s/'}],tip:'c 在这里对应 /s/。'},
  {letters:'co',sound:'/kəʊ/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'c',sound:'/k/'},{letters:'o',sound:'/əʊ/'}],tip:'词尾 o 对应 /əʊ/。'}
 ],anchor:{text:'旧金山：按 San + Francisco 记住完整地名。'},variantNote:'这里采用牛津词典所列的词组读法；其他英语口音的元音转写可能不同。现有录音尚未试听核对。',
 sources:[{label:'Oxford Learner’s Dictionaries · San Francisco',url:'https://www.oxfordlearnersdictionaries.com/us/definition/english/san-francisco'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
},{
 headword:'Las Vegas',ipa:'/ˌlæs ˈveɪɡəs/',uk:'/ˌlæs ˈveɪɡəs/',
 chunks:[
  {letters:'Las ',sound:'/ˌlæs /',stress:'secondary',hint:'次重读。',pairs:[{letters:'L',sound:'/l/'},{letters:'a',sound:'/æ/'},{letters:'s',sound:'/s/'},{letters:' ',sound:''}],tip:'此词典读法中 a 对应 /æ/。'},
  {letters:'Ve',sound:'/ˈveɪ/',stress:'primary',hint:'主要重音。',pairs:[{letters:'V',sound:'/v/'},{letters:'e',sound:'/eɪ/'}],tip:'Ve 对应 /veɪ/。'},
  {letters:'gas',sound:'/ɡəs/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'g',sound:'/ɡ/'},{letters:'a',sound:'/ə/'},{letters:'s',sound:'/s/'}],tip:'词尾 a 弱读 /ə/。'}
 ],anchor:{text:'拉斯维加斯：按 Las + Vegas 记住完整地名。'},variantNote:'这里采用牛津词典所列的一种英式读法；其他口音或词典对 Las 的元音可能有不同标注。现有录音尚未试听核对。',
 sources:[{label:'Oxford Learner’s Dictionaries · Las Vegas',url:'https://www.oxfordlearnersdictionaries.com/definition/english/las-vegas'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
}];
