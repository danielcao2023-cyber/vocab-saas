import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('keeps sound and spelling for the reviewed final 21 double-letter mappings',()=>{
 const cases:[string,string,string][]=[['approach','pp','/p/'],['cattle','tt','/t/'],['classical','ss','/s/'],['opportunity','pp','/p/'],['assume','ss','/s/'],['addition','dd','/d/'],['commercial','mm','/m/'],['commercialise','mm','/m/'],['commercialisation','mm','/m/'],['commercialization','mm','/m/'],['occasion','cc','/k/'],['merry','rr','/r/'],['pudding','dd','/d/'],['inner','nn','/n/'],['wedding','dd','/d/'],['horrible','rr','/r/'],['Halloween','ll','/l/'],['dilemma','mm','/m/'],['illustrate','ll','/l/'],['marriage','rr','/r/'],['colleague','ll','/l/']];
 for(const [word,letters,sound] of cases){const lesson=getSoundSpellingLesson(word)!;expect(lesson.chunks.map(c=>c.letters).join(''),word).toBe(word);expect(lesson.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);}
 expect(getSoundSpellingLesson('cattle')!.chunks.find(c=>c.pairs.some(p=>p.letters==='tt'))!.stress).toBe('primary');
});
