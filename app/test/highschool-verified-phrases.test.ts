import {expect,it} from 'vitest';
import {highschoolVerifiedPhrases} from '../web/src/content/sound-spelling/highschool-verified-phrases';

it('matches the Pearson wordlist pronunciation and stress for to be frank',()=>{
 const lesson=highschoolVerifiedPhrases.find(item=>item.headword==='to be frank');
 expect(lesson?.ipa).toBe('/tə bɪ ˈfræŋk/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('to be frank');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','none','primary']);
 expect(lesson?.chunks.flatMap(chunk=>chunk.pairs).map(pair=>pair.letters).join('')).toBe('to be frank');
});
