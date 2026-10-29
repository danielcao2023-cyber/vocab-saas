import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('preserves reviewed double letter spelling while mapping each pair to its single sound',()=>{
 const cases:[string,string,string][]=[['illegally','ll','/l/'],['immediately','mm','/m/'],['blogger','gg','/ɡ/'],['battery','tt','/t/'],['button','tt','/t/'],['cyberbully','ll','/l/'],['embarrassing','rr','/r/'],['embarrassing','ss','/s/'],['puzzle','zz','/z/'],['currency','rr','/r/'],['surround','rr','/r/'],['battle','tt','/t/'],['announce','nn','/n/'],['gallery','ll','/l/']];
 for(const [word,letters,sound] of cases){
  const lesson=getSoundSpellingLesson(word)!;
  expect(lesson.chunks.map(c=>c.letters).join(''),word).toBe(word);
  expect(lesson.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);
 }
 const illegally=getSoundSpellingLesson('illegally')!;
 expect(illegally.chunks.flatMap(c=>c.pairs).filter(p=>p.letters==='ll'&&p.sound==='/l/')).toHaveLength(2);
});
