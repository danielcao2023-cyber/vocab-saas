import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('keeps spelling, sounds and stress while grouping reviewed consonant doubles',()=>{
 const cases=[['assist','ss','/s/','/əˈsɪst/'],['occur','cc','/k/','/əˈkɜːr/'],['collection','ll','/l/','/kəˈlekʃən/'],['sufficient','ff','/f/','/səˈfɪʃənt/'],['attach','tt','/t/','/əˈtætʃ/'],['efficient','ff','/f/','/ɪˈfɪʃənt/'],['appeal','pp','/p/','/əˈpiːl/']];
 for(const [word,letters,sound,ipa] of cases){const lesson=getSoundSpellingLesson(word)!;expect(lesson.ipa,word).toBe(ipa);for(const c of lesson.chunks){expect(c.pairs.map(p=>p.sound.replaceAll('/','')).join(''),word).toBe(c.sound.replaceAll('/',''))}expect(lesson.chunks.map(c=>c.letters).join('').toLowerCase(),word).toBe(word);const chunk=lesson.chunks.find(c=>c.pairs.some(p=>p.letters===letters&&p.sound===sound));expect(chunk,word).toBeDefined();expect(chunk?.stress,word).toBe('primary');expect(lesson.chunks.filter(c=>c.stress==='primary'),word).toHaveLength(1);expect(lesson.chunks.flatMap(c=>c.pairs).map(p=>p.letters).join('').toLowerCase(),word).toBe(word)}
});
