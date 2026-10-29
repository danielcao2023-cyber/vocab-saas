import type {SoundSpellingLesson} from './types';

// Independent candidate: registration in the main index is a separate review step.
export const highschoolArtemisinin: SoundSpellingLesson[] = [{
 headword:'artemisinin', ipa:'/ˌɑːtɪˈmɪzɪnɪn/', uk:'/ˌɑːtɪˈmɪzɪnɪn/',
 chunks:[
  {letters:'ar',sound:'/ɑː/',stress:'secondary',hint:'英式读法首段次重读。',pairs:[{letters:'ar',sound:'/ɑː/'}],tip:'ar 在这里对应 /ɑː/。'},
  {letters:'te',sound:'/tɪ/',stress:'none',hint:'轻读。',pairs:[{letters:'t',sound:'/t/'},{letters:'e',sound:'/ɪ/'}],tip:'e 在这里读 /ɪ/。'},
  {letters:'mi',sound:'/mɪ/',stress:'primary',hint:'此段主重读。',pairs:[{letters:'m',sound:'/m/'},{letters:'i',sound:'/ɪ/'}],tip:'此处的 i 读 /ɪ/。'},
  {letters:'sin',sound:'/zɪn/',stress:'none',hint:'轻读。',pairs:[{letters:'s',sound:'/z/'},{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'}],tip:'留意此处 s 对应 /z/。'},
  {letters:'in',sound:'/ɪn/',stress:'none',hint:'词尾轻读。',pairs:[{letters:'i',sound:'/ɪ/'},{letters:'n',sound:'/n/'}],tip:'末尾 in 对应 /ɪn/。'}
 ],
 anchor:{text:'英式读法主重音在 mi；注意后半部分连续的两个 i。'},
 variantNote:'此处按柯林斯所列英式读法分段；英语维基词典另列英式 /ˌɑːtɪˈmiːsɪnɪn/ 及美式 /ˌɑɹtəˈmɪsn̩ɪn/，不同来源的读法有差异。',
 sources:[{label:'Collins Dictionary · artemisinin 英式音标',url:'https://www.collinsdictionary.com/dictionary/english/artemisinin'},{label:'Wiktionary · 其他读音',url:'https://en.wiktionary.org/wiki/artemisinin#English'}],
 review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'Codex spelling alignment; source dictionary IPA'}
}];
