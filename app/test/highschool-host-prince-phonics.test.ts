import {expect,it} from 'vitest';
import {highschoolHostPrince} from '../web/src/content/sound-spelling/highschool-host-prince';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import {mainHeadwords} from '../server/src/text';

it('provides the missing forms of mixed headwords with complete letter alignment',()=>{
 for(const [mixed,first,ipa] of [['host / hostess','host','/həʊst/'],['prince / princess','prince','/prɪns/']]){
  const parts=mainHeadwords(mixed);
  expect(parts[0]).toBe(first);
  const missing=highschoolHostPrince.find(item=>item.headword===parts[0]);
  expect(missing?.ipa).toBe(ipa);
  expect(getSoundSpellingLesson(parts[0])?.ipa).toBe(ipa);
  expect(missing?.chunks.map(chunk=>chunk.pairs.map(pair=>pair.letters).join('')).join('')).toBe(first);
  expect(missing?.sources[0].url).toContain('dictionary.cambridge.org/pronunciation/english/');
  expect(getSoundSpellingLesson(parts[1])).toBeDefined();
 }
});
