import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('returns the dictionary-backed British iron mapping with complete spelling and sounds',()=>{
 const lesson=getSoundSpellingLesson('iron');expect(lesson?.uk).toBe('/aɪən/');expect(lesson?.chunks.map(c=>c.letters).join('')).toBe('iron');
 const pairs=lesson!.chunks.flatMap(c=>c.pairs);expect(pairs.map(p=>p.letters).join('')).toBe('iron');expect(pairs.map(p=>p.sound.replaceAll('/','')).join('')).toBe('aɪən');expect(lesson?.variantNote).toContain('美式');expect(lesson?.sources[0].url).toContain('cambridge.org/pronunciation/english/iron');
});
