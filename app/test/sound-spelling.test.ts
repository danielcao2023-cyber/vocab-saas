import {expect,it} from 'vitest';
import {soundSpellingLessons,getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';

// Detect dropped/repeated letters and misplaced phonemes in generated or edited teaching maps.
const sounds=(text:string)=>text.replace(/[\/ˈˌ.\s]/g,'');
it('preserves every letter and sound through both levels of every published map',()=>{
 expect(new Set(soundSpellingLessons.map(x=>x.headword)).size).toBe(soundSpellingLessons.length);
 for(const lesson of soundSpellingLessons){
  expect(lesson.chunks.map(c=>c.letters).join(''),lesson.headword).toBe(lesson.headword);
  expect(sounds(lesson.chunks.map(c=>c.sound).join('')),lesson.headword).toBe(sounds(lesson.ipa));
  expect(lesson.chunks.filter(c=>c.stress==='primary'),lesson.headword).toHaveLength(1);
  expect(lesson.chunks.filter(c=>c.stress==='secondary').length,lesson.headword).toBe((lesson.ipa.match(/ˌ/g)??[]).length);
  for(const chunk of lesson.chunks){
   expect(chunk.letters.trim().length,lesson.headword).toBeGreaterThan(0);
   expect(chunk.pairs.map(p=>p.letters).join(''),`${lesson.headword}/${chunk.letters}`).toBe(chunk.letters);
   expect(sounds(chunk.pairs.map(p=>p.sound).join('')),`${lesson.headword}/${chunk.letters}`).toBe(sounds(chunk.sound));
  }
 }
});

it('keeps remember b audible and preserves the complete tion spelling group',()=>{
 const remember=getSoundSpellingLesson('remember')!;
 expect(remember.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='b')?.sound).toBe('/b/');
 for(const word of ['action','attention','information','education']){
  expect(getSoundSpellingLesson(word)?.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='tion')?.sound,word).toBe('/ʃən/');
 }
});
