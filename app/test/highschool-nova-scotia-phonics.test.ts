import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('maps Nova Scotia with both stresses and its English pronunciation source',()=>{
 const lesson=getSoundSpellingLesson('Nova Scotia');
 expect(lesson?.ipa).toBe('/ˌnoʊvə ˈskoʊʃə/');
 expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('Nova Scotia');
 expect(lesson?.chunks.find(c=>c.stress==='secondary')?.letters).toBe('No');
 expect(lesson?.chunks.find(c=>c.stress==='primary')?.letters).toBe('Sco');
 expect(lesson?.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='ti')?.sound).toBe('/ʃ/');
 expect(lesson?.sources.some(s=>s.url==='https://en.wiktionary.org/wiki/Nova_Scotia#English')).toBe(true);
});
