import type {SoundSpellingLesson} from './types';

/** Curated word-level correspondences, not universal spelling rules. */
export const governmentSoundSpelling = {
 headword:'government',
 ipa:'/ˈɡʌv.ɚn.mənt/',
 chunks:[
  {letters:'gov',sound:'/ɡʌv/',stress:'primary',hint:'这一段读得最突出',
   pairs:[{letters:'g',sound:'/ɡ/'},{letters:'o',sound:'/ʌ/'},{letters:'v',sound:'/v/'}],
   tip:'o 在这个词中对应 /ʌ/，不要按字母名 /oʊ/ 来读。先记住 /ɡʌv/ 对应 gov。'},
  {letters:'ern',sound:'/ɚn/',stress:'none',hint:'er 合在一起对应一个音',
   pairs:[{letters:'er',sound:'/ɚ/'},{letters:'n',sound:'/n/'}],
   tip:'美式读音中，er 对应带 r 色彩的弱元音 /ɚ/，后面接 /n/。/ɚ/ 也常写成 /ər/。拼写时保留 ern，尤其不要漏掉中间的 n。'},
  {letters:'ment',sound:'/mənt/',stress:'none',hint:'e 弱读，字母仍要写',
   pairs:[{letters:'m',sound:'/m/'},{letters:'e',sound:'/ə/'},{letters:'n',sound:'/n/'},{letters:'t',sound:'/t/'}],
   tip:'结尾 e 对应轻短的 /ə/，不是字母名 /iː/。把 /mənt/ 和 ment 一起记，写全 m-e-n-t。'},
 ],
 anchor:{text:'中间的 n 要保留，结尾弱读的 e 也要写。',parts:[{text:'gover'},{text:'n',emphasis:true},{text:'m'},{text:'e',emphasis:true},{text:'nt'}],formation:'govern + ment → government'},
 review:{status:'reviewed',reviewedAt:'2026-10-20',draftedBy:'Codex'},
 uk:'/ˈɡʌv.ən.mənt/',
 variantNote:'英式常见读法中，er 对应 /ə/；也有省略中间 /n/ 的读法 /ˈɡʌv.ə.mənt/。无论听起来中间 n 是否明显，拼写都保留 government 中的两个 n。',
 sources:[
  {label:'Cambridge · 英美读音与逐音对照',url:'https://dictionary.cambridge.org/us/pronunciation/english/government'},
  {label:'Oxford · 读音核对',url:'https://www.oxfordlearnersdictionaries.com/definition/english/government'},
 ],
} satisfies SoundSpellingLesson;
