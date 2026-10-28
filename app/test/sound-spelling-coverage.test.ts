import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {getSoundSpellingLesson,soundSpellingLessons} from '../web/src/content/sound-spelling/index';

it('opens spelling maps for annotated and mixed curriculum headwords',()=>{
 for(const headword of ['according (to)','centre (AmE center)','actor / actress','host / hostess','prince / princess','policeman / policewoman (pl. policemen / policewomen)']){
  expect(getSoundSpellingLesson(headword),headword).toBeDefined();
 }
 expect(getSoundSpellingLesson('host / hostess')?.headword).toBe('hostess');
 expect(getSoundSpellingLesson('prince / princess')?.headword).toBe('princess');
});

it('covers all 813 audited multisyllabic entries, including each mixed multisyllabic form',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../qa/sound-spelling/multisyllabic-coverage.json',import.meta.url),'utf8'));
 expect(catalog.entries).toHaveLength(813);
 expect(soundSpellingLessons).toHaveLength(819+42+6+5+10+9+6+6+4+4+3+3+3+1+4+5+1+3+1+6+5+6+4+5+6+5+3+6+4+5+5+4+3+6+3+6+5+4+6+5+2+5+5+5+7+10+8+6+8+8+10+6+8+7+7+6+8+7+6+7+7+6+7+6+5+9+10+5+5+5+9+7+6+3+12+3+6+6+8+7+6+5+3+6+3+2+6+6+8+5+6+6+3+4+4+1);
 for(const entry of catalog.entries){
  expect(getSoundSpellingLesson(entry.headword),entry.headword).toBeDefined();
  for(const form of entry.forms)expect(getSoundSpellingLesson(form),form).toBeDefined();
 }
});

it('anchors stress to the actual vowel position, not just a matching mark count',()=>{
 const clean=(s:string)=>s.replace(/[\/ˈˌ.\s]/g,'');
 const vowels=/[aeiouæɑɒɔʌəɚɝɪʊɛɜʏœøɐɨɯɶ]/;
 for(const lesson of soundSpellingLessons){
  const stressed:{kind:string;position:number}[]=[];let position=0;
  for(const ch of lesson.ipa){
   if(ch==='ˈ'||ch==='ˌ')stressed.push({kind:ch==='ˈ'?'primary':'secondary',position});
   else position+=clean(ch).length;
  }
  const ipa=clean(lesson.ipa);
  for(const marker of stressed){
   const vowel=ipa.slice(marker.position).search(vowels);
   expect(vowel,lesson.headword).toBeGreaterThanOrEqual(0);
   const target=marker.position+vowel;let offset=0;
   const chunk=lesson.chunks.find(c=>{const end=offset+clean(c.sound).length;const contains=target>=offset&&target<end;offset=end;return contains;});
   expect(chunk?.stress,`${lesson.headword} stress at ${target}`).toBe(marker.kind);
  }
 }
});
