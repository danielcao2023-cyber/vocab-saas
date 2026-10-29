import {expect,it} from 'vitest';
import {highschoolNanobot} from '../web/src/content/sound-spelling/highschool-nanobot';

it('maps nanobot spelling, British pronunciation and stress',()=>{
 expect(highschoolNanobot.ipa).toBe('/ˈnænəʊbɒt/');
 expect(highschoolNanobot.chunks.map(chunk=>chunk.letters).join('')).toBe('nanobot');
 expect(highschoolNanobot.chunks.map(chunk=>chunk.stress)).toEqual(['primary','none','none']);
 expect(highschoolNanobot.chunks.map(chunk=>chunk.pairs.map(pair=>pair.letters).join(''))).toEqual(['nan','o','bot']);
 expect(highschoolNanobot.chunks.map(chunk=>chunk.pairs.map(pair=>pair.sound.replaceAll('/','')).join(''))).toEqual(['næn','əʊ','bɒt']);
});
