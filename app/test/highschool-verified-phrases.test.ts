import {expect,it} from 'vitest';
import {highschoolVerifiedPhrases} from '../web/src/content/sound-spelling/highschool-verified-phrases';

it('matches the Pearson wordlist pronunciation and stress for to be frank',()=>{
 const lesson=highschoolVerifiedPhrases.find(item=>item.headword==='to be frank');
 expect(lesson?.ipa).toBe('/tə bɪ ˈfræŋk/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('to be frank');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','none','primary']);
 expect(lesson?.chunks.flatMap(chunk=>chunk.pairs).map(pair=>pair.letters).join('')).toBe('to be frank');
});

it('matches the Klett wordlist pronunciation and stress for in the open air',()=>{
 const lesson=highschoolVerifiedPhrases.find(item=>item.headword==='in the open air');
 expect(lesson?.ipa).toBe('/ɪn ði ˌəʊpn ˈeə/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('in the open air');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','none','secondary','none','primary']);
 expect(lesson?.chunks.flatMap(chunk=>chunk.pairs).map(pair=>pair.letters).join('')).toBe('in the open air');
});

it('matches the English Walker pronunciation and stress for roast turkey',()=>{
 const lesson=highschoolVerifiedPhrases.find(item=>item.headword==='roast turkey');
 expect(lesson?.ipa).toBe('/ˌrəʊst ˈtɜːki/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('roast turkey');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','primary','none']);
 expect(lesson?.chunks.flatMap(chunk=>chunk.pairs).map(pair=>pair.letters).join('')).toBe('roast turkey');
});

it('matches the Close-up wordlist pronunciation and stress for date back',()=>{
 const lesson=highschoolVerifiedPhrases.find(item=>item.headword==='date back');
 expect(lesson?.ipa).toBe('/deɪt ˈbæk/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('date back');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','primary']);
 expect(lesson?.chunks.flatMap(chunk=>chunk.pairs).map(pair=>pair.letters).join('')).toBe('date back');
});

it('matches the Success in Business pronunciation and stress for make a proposal',()=>{
 const lesson=highschoolVerifiedPhrases.find(item=>item.headword==='make a proposal');
 expect(lesson?.ipa).toBe('/meɪk ə prəˈpəʊzəl/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('make a proposal');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','none','none','primary','none']);
 expect(lesson?.chunks.flatMap(chunk=>chunk.pairs).map(pair=>pair.letters).join('')).toBe('make a proposal');
});
