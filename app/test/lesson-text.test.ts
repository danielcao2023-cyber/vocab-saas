import {expect,it} from 'vitest';
import {lessonWordParts} from '../web/src/lesson-text';

const forms=(...words:string[])=>words.map(form=>({label:'词形',form,ipa:'',note:''}));
it('highlights explicit regular and irregular forms without matching inside other words',()=>{
  const parts=lessonWordParts('We began to begin again, but beginners did not begin.',{headword:'begin',forms:forms('begin','began','begun','beginning')});
  expect(parts.filter(part=>part.highlighted).map(part=>part.text)).toEqual(['began','begin','begin']);
  expect(parts.map(part=>part.text).join('')).toBe('We began to begin again, but beginners did not begin.');
});
it('escapes punctuation and matches phrases with whole-word boundaries',()=>{
  expect(lessonWordParts('At 8 a.m., A.M. means morning; xam is unrelated.',{headword:'a.m.',forms:[]}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['a.m.','A.M.']);
  expect(lessonWordParts('Please look after her; look afterwards is different.',{headword:'look after',forms:[]}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['look after']);
});
it('supports contractions and separate inflection alternatives without interpreting regex syntax',()=>{
  expect(lessonWordParts("We were ready. He was ready. They weren't ready.",{headword:'be',forms:forms('was / were')}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['were','was']);
  expect(lessonWordParts('C++ and C+ are different.',{headword:'C++',forms:[]}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['C++']);
});

it('handles displayed headword aliases and typographic apostrophes while preserving acronym case',()=>{
  expect(lessonWordParts('An apple and a pear.',{headword:'a/an',forms:[]}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['An','a']);
  expect(lessonWordParts('AI can help us in the US.',{headword:'AI (= artificial intelligence)',forms:[]}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['AI']);
  expect(lessonWordParts('The US invited us.',{headword:'US',forms:[]}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['US']);
  expect(lessonWordParts('Don’t stop.',{headword:"don't",forms:[]}).filter(part=>part.highlighted).map(part=>part.text)).toEqual(['Don’t']);
});
