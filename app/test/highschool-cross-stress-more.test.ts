import {expect, it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it.each(['exploit', 'explode', 'extend'])('%s shows where x crosses the stress boundary', word => {
 const lesson = getSoundSpellingLesson(word)!;
 expect(lesson.chunks.map(chunk => chunk.letters).join('')).toBe(word);
 const boundary = lesson.chunks.find(chunk => chunk.crossesStressBoundary);
 expect(boundary?.pairs.find(pair => pair.letters === 'x')?.sound).toBe('/kˈs/');
 expect(boundary?.tip).toContain('/s/');
 expect(boundary?.stress).toBe('none');
});
