import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('shows each reviewed double letter as a single sound without losing spelling',()=>{
 const cases:[string,string,string][]=[['calligraphy','ll','/l/'],['appreciate','pp','/p/'],['struggle','gg','/ɡ/'],['committee','mm','/m/'],['committee','tt','/t/'],['disappear','pp','/p/'],['attempt','tt','/t/'],['professional','ss','/ʃ/'],['annoyed','nn','/n/'],['annoy','nn','/n/'],['illegal','ll','/l/']];
 for(const [word,letters,sound] of cases){
  const lesson=getSoundSpellingLesson(word)!;
  expect(lesson.chunks.map(c=>c.letters).join(''),word).toBe(word);
  expect(lesson.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);
 }
});
