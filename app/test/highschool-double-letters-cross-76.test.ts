import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('keeps reviewed double spellings together without losing any word letters',()=>{
 const cases:[string,string,string][]=[['upper','pp','/p/'],['permission','ss','/ʃ/'],['committed','mm','/m/'],['committed','tt','/t/'],['commit','mm','/m/'],['apparently','pp','/p/'],['passion','ss','/ʃ/'],['gradually','ll','/l/'],['professor','ss','/s/'],['appliance','pp','/p/'],['command','mm','/m/'],['potentially','ll','/l/'],['innovation','nn','/n/'],['occupation','cc','/k/'],['oppose','pp','/p/'],['essay','ss','/s/'],['accurate','cc','/k/'],['valley','ll','/l/'],['territory','rr','/r/'],['cottage','tt','/t/'],['accompany','cc','/k/']];
 for(const [word,letters,sound] of cases){const l=getSoundSpellingLesson(word)!;expect(l.chunks.map(c=>c.letters).join(''),word).toBe(word);expect(l.chunks.flatMap(c=>c.pairs).some(p=>p.letters===letters&&p.sound===sound),word).toBe(true);}
 for(const word of ['commit','committed'])expect(getSoundSpellingLesson(word)!.chunks.find(c=>c.pairs.some(p=>p.letters==='mm'))!.stress,word).toBe('primary');
});
