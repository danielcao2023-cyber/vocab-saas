import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
it('groups spelling digraphs without hiding a contributing letter',()=>{
 for(const [word,letters,sound] of [['Christmas carol','Ch','/k/'],['elsewhere','wh','/w/'],['whisper','wh','/w/'],['nowhere','wh','/w/'],['strengthen','ng','/ŋ/']] as const){
  const lesson=getSoundSpellingLessons(word)[0];expect(lesson,word).toBeDefined();
  expect(lesson.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);
  expect(lesson.chunks.map(c=>c.letters).join(''),word).toBe(word);
 }
});
