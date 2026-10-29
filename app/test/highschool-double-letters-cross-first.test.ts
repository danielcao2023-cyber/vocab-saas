import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('preserves the displayed spelling and pronunciation when combining double letters across chunks',()=>{
 for(const [word,letters,sound,stress] of [
  ['billion','ll','/l/','primary'],
  ['issue','ss','/ʃ/','primary'],
  ['application','pp','/p/','secondary'],
 ]){
  const lesson=getSoundSpellingLesson(word)!;
  expect(lesson.chunks.map(c=>c.letters).join('')).toBe(word);
  const chunk=lesson.chunks.find(c=>c.pairs.some(p=>p.letters===letters && p.sound===sound))!;
  expect(chunk.stress).toBe(stress);
 }
});
