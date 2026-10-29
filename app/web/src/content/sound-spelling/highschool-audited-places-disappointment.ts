import type {SoundSpellingLesson} from './types';

export const highschoolAuditedPlacesDisappointment: SoundSpellingLesson[] = [
 {
  headword:'Birmingham', ipa:'/ˈbɜːmɪŋəm/', uk:'/ˈbɜːmɪŋəm/',
  chunks:[
   {letters:'Bir',sound:'/bɜː/',stress:'primary',hint:'英国地名第一部分重读。',pairs:[{letters:'B',sound:'/b/'},{letters:'ir',sound:'/ɜː/'}],tip:'ir 对应 /ɜː/。'},
   {letters:'ming',sound:'/mɪŋ/',stress:'none',hint:'中间轻读。',pairs:[{letters:'m',sound:'/m/'},{letters:'i',sound:'/ɪ/'},{letters:'ng',sound:'/ŋ/'}],tip:'ng 对应 /ŋ/。'},
   {letters:'ham',sound:'/əm/',stress:'none',hint:'英国地名末尾轻读。',pairs:[{letters:'h',sound:''},{letters:'a',sound:'/ə/'},{letters:'m',sound:'/m/'}],tip:'此处 h 不发音，a 弱读 /ə/。'}
  ],anchor:{text:'英国伯明翰：第一部分重读，词尾 ham 中的 h 不发音。'},
  variantNote:'这里讲解英国城市 Birmingham 的读法；美国同名城市的末尾常读 /hæm/，不能简单当作同一地名的口音变化。',
  sources:[{label:'Cambridge Dictionary · Birmingham 英语读音',url:'https://dictionary.cambridge.org/pronunciation/english/birmingham'},{label:'Cambridge Dictionary · 英语地名读音说明',url:'https://dictionaryblog.cambridge.org/2018/11/14/london-leicester-and-lincoln-pronouncing-english-place-names/'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex dictionary-based spelling alignment'}
 },
 {
  headword:'Switzerland',ipa:'/ˈswɪtsɚlənd/',uk:'/ˈswɪtsələnd/',
  chunks:[
   {letters:'Swit',sound:'/swɪt/',stress:'primary',hint:'第一部分重读。',pairs:[{letters:'S',sound:'/s/'},{letters:'w',sound:'/w/'},{letters:'i',sound:'/ɪ/'},{letters:'t',sound:'/t/'}],tip:'Swit 对应 /swɪt/。'},
   {letters:'zer',sound:'/sɚ/',stress:'none',hint:'中间部分轻读。',pairs:[{letters:'z',sound:'/s/'},{letters:'er',sound:'/ɚ/'}],tip:'z 对应 /s/；美式 er 带卷舌。'},
   {letters:'land',sound:'/lənd/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'l',sound:'/l/'},{letters:'a',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:'d',sound:'/d/'}],tip:'此处 land 的 a 弱读 /ə/。'}
  ],anchor:{text:'第一部分重读；留意 z 在这里对应 /s/。'},variantNote:'上方分段按美式 /ˈswɪtsɚlənd/；英式常读 /ˈswɪtsələnd/，中间元音通常不卷舌。',
  sources:[{label:'Cambridge Dictionary · Switzerland 英语读音',url:'https://dictionary.cambridge.org/pronunciation/english/switzerland'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex dictionary-based spelling alignment'}
 },
 {
  headword:'disappointment',ipa:'/ˌdɪsəˈpɔɪntmənt/',uk:'/ˌdɪsəˈpɔɪntmənt/',
  chunks:[
   {letters:'dis',sound:'/dɪs/',stress:'secondary',hint:'此部分次重读。',pairs:[{letters:'d',sound:'/d/'},{letters:'i',sound:'/ɪ/'},{letters:'s',sound:'/s/'}],tip:'dis 次重读。'},
   {letters:'a',sound:'/ə/',stress:'none',hint:'轻读。',pairs:[{letters:'a',sound:'/ə/'}],tip:'a 弱读 /ə/。'},
   {letters:'ppoint',sound:'/pɔɪnt/',stress:'primary',hint:'此部分主重读。',pairs:[{letters:'pp',sound:'/p/'},{letters:'oi',sound:'/ɔɪ/'},{letters:'n',sound:'/n/'},{letters:'t',sound:'/t/'}],tip:'两个 p 合读一个 /p/；oi 对应 /ɔɪ/。'},
   {letters:'ment',sound:'/mənt/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'m',sound:'/m/'},{letters:'e',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:'t',sound:'/t/'}],tip:'词尾 ment 弱读。'}
  ],anchor:{text:'主重音在 point 部分，注意拼写中的双 p。'},variantNote:'英美词典音标均可标为 /ˌdɪsəˈpɔɪntmənt/；实际语流中发音可能有变化。',
  sources:[{label:'Cambridge Dictionary · disappointment 词条及读音',url:'https://dictionary.cambridge.org/dictionary/english/disappointment'}],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex dictionary-based spelling alignment'}
 }
];
