import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
import {highschoolCarlaAishaVerified} from '../web/src/content/sound-spelling/highschool-carla-aisha-verified';
it('returns sourced personal-name mappings with matching spellings, sounds and stress',()=>{
 for(const [word,ipa,sounds,stresses] of [
  ['Carla','/ˈkɑːlə/',['/k/','/ɑː/','/l/','/ə/'],['primary','none']],
  ['Aisha','/aɪˈiːʃə/',['/aɪ/','/iː/','/ʃ/','/ə/'],['none','primary','none']]
 ] as const){
  const lesson=highschoolCarlaAishaVerified.find(x=>x.headword===word)!;
  expect(getSoundSpellingLessons(word)).toContainEqual(lesson);
  expect(lesson.ipa).toBe(ipa);expect(lesson.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson.chunks.map(c=>c.pairs.map(p=>p.letters).join(''))).toEqual(lesson.chunks.map(c=>c.letters));
  expect(lesson.chunks.flatMap(c=>c.pairs.map(p=>p.sound))).toEqual(sounds);
  expect(lesson.chunks.map(c=>c.stress)).toEqual(stresses);
 }
});
