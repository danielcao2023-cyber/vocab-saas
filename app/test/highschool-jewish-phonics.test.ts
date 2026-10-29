import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
import {highschoolJewishVerified} from '../web/src/content/sound-spelling/highschool-jewish-verified';
it('preserves the spelling and the dictionary phonemes for Jewish',()=>{
 const [lesson]=highschoolJewishVerified;
 expect(lesson.headword).toBe('Jewish');
 expect(getSoundSpellingLessons('Jewish')).toContainEqual(lesson);
 expect(lesson.ipa).toBe('/ˈdʒuːɪʃ/');
 expect(lesson.chunks.map(c=>c.letters).join('')).toBe(lesson.headword);
 expect(lesson.chunks.map(c=>c.pairs.map(p=>p.letters).join(''))).toEqual(lesson.chunks.map(c=>c.letters));
 expect(lesson.chunks.map(c=>c.stress)).toEqual(['primary','none']);
 expect(lesson.chunks.flatMap(c=>c.pairs.map(p=>p.sound))).toEqual(['/dʒ/','/uː/','/ɪ/','/ʃ/']);
});
