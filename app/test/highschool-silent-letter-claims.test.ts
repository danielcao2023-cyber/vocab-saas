import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';

it('explains the spelling role of the final e in engage',()=>{
 const lesson=getSoundSpellingLessons('engage')[0];
 expect(lesson.ipa).toBe('/ɪnˈɡeɪdʒ/');
 expect(lesson.variantNote).toContain('e 不单独发音，也提示这里的 g 为软音');
 expect(lesson.sources.some(s=>s.url==='https://www.spellzone.com/unit19/page8.cfm')).toBe(true);
});

it('explains the role of final e without contradicting the pronunciation groups',()=>{
 for(const [word, fragment] of Object.entries({venue:'ue 共同对应 /juː/',barbecue:'ue 在此对应 /juː/',escape:'a-e 拼写',precise:'i-e 拼写',recite:'i-e 拼写',delete:'e-e 拼写'})){
  const lesson=getSoundSpellingLessons(word)[0];
  expect(lesson.variantNote,word).toContain(fragment);
 }
});

it('explains cited split-vowel spellings in common words',()=>{
 for(const [word,fragment] of [['athlete','e-e 拼写'],['compete','e-e 拼写'],['estate','a-e 拼写'],['theme park','e-e 拼写']]){
  const lesson=getSoundSpellingLessons(word)[0];
  expect([lesson.variantNote,...lesson.chunks.map(c=>c.tip)].join(' '),word).toContain(fragment);
 }
});
