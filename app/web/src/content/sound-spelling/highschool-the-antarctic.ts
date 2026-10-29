import type {SoundSpellingLesson} from './types';
export const highschoolTheAntarctic: SoundSpellingLesson[] = [{
 headword:'the Antarctic', ipa:'/ðiː ænˈtɑːktɪk/', uk:'/ðiː ænˈtɑːktɪk/',
 chunks:[
  {letters:'the ',sound:'/ðiː /',stress:'none',hint:'冠词在元音音素前读 /ðiː/。',pairs:[{letters:'th',sound:'/ð/'},{letters:'e',sound:'/iː/'},{letters:' ',sound:''}],tip:'Antarctic 以元音音素开头，the 通常读 /ðiː/。'},
  {letters:'An',sound:'/æn/',stress:'none',hint:'此部分轻读。',pairs:[{letters:'A',sound:'/æ/'},{letters:'n',sound:'/n/'}],tip:'A 在这里对应 /æ/。'},
  {letters:'tarc',sound:'/ˈtɑːk/',stress:'primary',hint:'此部分重读。',pairs:[{letters:'t',sound:'/t/'},{letters:'a',sound:'/ɑː/'},{letters:'r',sound:''},{letters:'c',sound:'/k/'}],tip:'在所列英式读法中 r 不单独发音，c 对应 /k/。'},
  {letters:'tic',sound:'/tɪk/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'t',sound:'/t/'},{letters:'i',sound:'/ɪ/'},{letters:'c',sound:'/k/'}],tip:'词尾 c 对应 /k/。'}
 ],
 anchor:{text:'南极地区：先读冠词，再按 Antarctic 的声音与拼写分组记忆。'},
 variantNote:'这里采用剑桥教材索引所列的英式短语读法；美式 Antarctic 常带 r 音，口音和连读也可能不同。现有录音尚未试听核对。',
 sources:[{label:'Cambridge · English Vocabulary in Use index',url:'https://assets.cambridge.org/97813166/31744/index/9781316631744_index.pdf'},{label:'Cambridge Grammar · the',url:'https://dictionary.cambridge.org/grammar/british-grammar/the'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex phoneme/letter alignment'}
}];
