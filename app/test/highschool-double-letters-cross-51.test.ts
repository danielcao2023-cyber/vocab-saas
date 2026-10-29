import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('keeps reviewed double spellings together and preserves the complete word',()=>{
 const cases:[string,string,string][]=[['passive','ss','/s/'],['mission','ss','/ʃ/'],['graffiti','ff','/f/'],['accessory','ss','/s/'],['settle','tt','/t/'],['intelligent','ll','/l/'],['satellite','ll','/l/'],['disappointed','pp','/p/'],['current','rr','/r/'],['tissue','ss','/ʃ/'],['shallow','ll','/l/'],['pattern','tt','/t/'],['pillow','ll','/l/'],['narration','rr','/r/'],['eventually','ll','/l/'],['willing','ll','/l/'],['ambassador','ss','/s/']];
 for(const [word,letters,sound] of cases){const lesson=getSoundSpellingLesson(word)!;expect(lesson.chunks.map(c=>c.letters).join(''),word).toBe(word);expect(lesson.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);}
});
