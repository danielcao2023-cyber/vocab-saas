import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
import {highschoolFifaNasaVerified} from '../web/src/content/sound-spelling/highschool-fifa-nasa-verified';
it('reads word-pronounced initialisms with their own phoneme mappings',()=>{
 for(const [word,ipa,sounds] of [['FIFA','/ˈfiːfə/',['/f/','/iː/','/f/','/ə/']],['NASA','/ˈnæsə/',['/n/','/æ/','/s/','/ə/']]] as const){
  const lesson=highschoolFifaNasaVerified.find(x=>x.headword===word)!;
  expect(getSoundSpellingLessons(word)).toContainEqual(lesson);
  expect(lesson.ipa).toBe(ipa);expect(lesson.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(lesson.chunks.map(c=>c.pairs.map(p=>p.letters).join(''))).toEqual(lesson.chunks.map(c=>c.letters));
  expect(lesson.chunks.flatMap(c=>c.pairs.map(p=>p.sound))).toEqual(sounds);
  expect(lesson.chunks.map(c=>c.stress)).toEqual(['primary','none']);
 }
});
