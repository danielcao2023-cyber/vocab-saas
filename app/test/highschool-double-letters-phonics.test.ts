import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('shows double letters that share one sound together',()=>{
 const cases=[['process','ss','/s/'],['appoint','pp','/p/'],['waitress','ss','/s/'],['nevertheless','ss','/s/'],['witness','ss','/s/'],['assessment','ss','/s/'],['assess','ss','/s/'],['embarrassed','ss','/s/'],['recall','ll','/l/'],['homesickness','ss','/s/'],['depressed','ss','/s/'],['depress','ss','/s/'],['regardless','ss','/s/'],['overall','ll','/l/'],['enroll','ll','/l/'],['assemble','ss','/s/']];
 for(const [word,letters,sound] of cases){
  const lesson=getSoundSpellingLesson(word)!;
  expect(lesson.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);
 }
});
