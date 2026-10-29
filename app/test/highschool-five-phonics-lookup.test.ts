import {describe,it,expect} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling/index';
const cases=[
 {input:'Thanksgiving',headword:'thanksgiving',ipa:'/ˌθæŋksˈɡɪvɪŋ/'},
 {input:'café',headword:'café',ipa:'/kæfˈeɪ/'},
 {input:'hip-hop',headword:'hip-hop',ipa:'/ˈhɪphɑːp/'},
 {input:'Anglo-Saxon',headword:'anglo-saxon',ipa:'/ˌæŋɡloʊˈsæksən/'},
 {input:'artemisinin',headword:'artemisinin',ipa:'/ˌɑːtɪˈmɪzɪnɪn/'},
] as const;
const strip=(s:string)=>s.replace(/[\/ˈˌ.\s]/g,'');
describe('high-school phonics word lookup and structure',()=>{
 it.each(cases)('$input resolves through the actual lookup, including case changes',({input,headword,ipa})=>{
  const found=getSoundSpellingLessons(input);expect(found).toHaveLength(1);
  const lesson=found[0];expect(lesson.headword).toBe(headword);expect(lesson.ipa).toBe(ipa);
  expect(getSoundSpellingLessons(input.toUpperCase()).map(x=>x.headword)).toEqual([headword]);
  expect(lesson.chunks.map(x=>x.letters).join('')).toBe(headword);
  expect(lesson.chunks.flatMap(x=>x.pairs).map(x=>x.letters).join('')).toBe(headword);
  for(const chunk of lesson.chunks){
   expect(chunk.pairs.map(x=>x.letters).join('')).toBe(chunk.letters);
   expect(chunk.pairs.map(x=>strip(x.sound)).join('')).toBe(strip(chunk.sound));
  }
  const reconstructed=lesson.chunks.map(c=>(c.stress==='primary'?'ˈ':c.stress==='secondary'?'ˌ':'')+strip(c.sound)).join('');
  expect(reconstructed).toBe(lesson.ipa.replace(/[\/.\s]/g,''));
  expect(lesson.sources.length).toBeGreaterThan(0);
 });
 it('does not silently match misspellings or omit the accented letter and hyphen',()=>{
  for(const word of ['thanksgivin','cafe','hiphop','anglosaxon','artemisininx'])expect(getSoundSpellingLessons(word)).toEqual([]);
 });
});
