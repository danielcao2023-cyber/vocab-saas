import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('presents the double r of diarrhoea as one /r/ sound',()=>{
 const lesson=getSoundSpellingLesson('diarrhoea')!;
 expect(lesson.chunks.map(chunk=>chunk.letters).join('')).toBe('diarrhoea');
 expect(lesson.chunks.flatMap(chunk=>chunk.pairs).find(pair=>pair.letters==='rr')?.sound).toBe('/r/');
 expect(lesson.chunks.flatMap(chunk=>chunk.pairs).some(pair=>pair.letters==='r' && !pair.sound)).toBe(false);
});
