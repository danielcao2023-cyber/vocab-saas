import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides textbook character names and optional Book 1 Unit 1 science terms',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2680,'Roderick'],[2681,'Oliver'],[2682,'Henry Adams'],[2683,'The Phantom of the Opera'],[2684,'Reid'],[2685,'Todd'],[2686,'Portia Langham'],[2687,'physiology'],[2688,'artemisinin'],[2689,'crucial'],[2690,'malaria'],[2691,'vital'],[2692,'committed']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['physiology','crucial','malaria','vital','committed']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='artemisinin')).toMatchObject({meaning:'n. 青蒿素',meaningCorrection:{expected:'[医]Arteannuin'}});
});
