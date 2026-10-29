import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('shows the double s of essential together as one /s/ sound',()=>{
 const lesson=getSoundSpellingLesson('essential')!;
 expect(lesson.chunks.map(chunk=>chunk.letters).join('')).toBe('essential');
 const chunk=lesson.chunks.find(chunk=>chunk.pairs.some(pair=>pair.letters==='ss'))!;
 expect(chunk.stress).toBe('primary');
 expect(chunk.pairs.find(pair=>pair.letters==='ss')?.sound).toBe('/s/');
 expect(lesson.chunks.flatMap(chunk=>chunk.pairs).some(pair=>pair.letters==='s' && !pair.sound)).toBe(false);
});
