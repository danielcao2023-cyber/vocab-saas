import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';

it('shows the British pronunciation and full spelling for concentrate on',()=>{
 const lesson=getSoundSpellingLesson('concentrate on');
 expect(lesson?.ipa).toBe('/ˈkɒnsəntreɪt ɒn/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('concentrate on');
 expect(lesson?.chunks.at(-1)?.pairs.map(pair=>pair.sound).join('')).toBe('/ɒ//n/');
});

it('shows the Pearson British pronunciation and full spelling for at last',()=>{
 const lesson=getSoundSpellingLesson('at last');
 expect(lesson?.ipa).toBe('/ət ˈlɑːst/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('at last');
 expect(lesson?.chunks[1]?.stress).toBe('primary');
});

it('shows the Pearson British pronunciation and full spelling for trip over',()=>{
 const lesson=getSoundSpellingLesson('trip over');
 expect(lesson?.ipa).toBe('/trɪp ˈəʊvə/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('trip over');
 expect(lesson?.chunks[1]?.stress).toBe('primary');
});
