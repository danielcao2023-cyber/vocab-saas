import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('keeps spelling and reviewed sound for the five previously uncertain items',()=>{
 const cases:[string,string,string][]=[['immigrant','mm','/m/'],['Challenger','ll','/l/'],['narrator','rr','/r/'],['penicillin','ll','/l/'],['corridor','rr','/r/']];
 for(const [word,letters,sound] of cases){const lesson=getSoundSpellingLesson(word)!;expect(lesson.chunks.map(c=>c.letters).join(''),word).toBe(word);expect(lesson.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);expect(lesson.sources.some(s=>/oxfordlearnersdictionaries|collinsdictionary/.test(s.url)),word).toBe(true);}
});
