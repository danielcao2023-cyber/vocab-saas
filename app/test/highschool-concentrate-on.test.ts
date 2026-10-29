import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';

it('shows the British pronunciation and full spelling for concentrate on',()=>{
 const lesson=getSoundSpellingLesson('concentrate on');
 expect(lesson?.ipa).toBe('/ˈkɒnsəntreɪt ɒn/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('concentrate on');
 expect(lesson?.chunks.at(-1)?.pairs.map(pair=>pair.sound).join('')).toBe('/ɒ//n/');
});
