import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides Book 3 Unit 5 indicate vocabulary and corrects postpone pronunciation',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2636,'to be honest'],[2637,'ought to'],[2638,'be about to do sth.'],[2639,'indicate'],[2640,'beneath'],[2641,'postpone'],[2642,'odd'],[2643,'obligation'],[2644,'intention'],[2645,'nowhere'],[2646,'in case'],[2647,'extent'],[2648,'to ... extent'],[2649,'musical'],[2650,'dinosaur']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['indicate','beneath','postpone','obligation','intention','nowhere','extent','musical','dinosaur']) expect(getSoundSpellingLesson(word),word).toBeDefined();
 expect(catalog.entries.find(e=>e.headword==='postpone')).toMatchObject({phonetic:'/poʊstˈpoʊn/',phoneticCorrection:{expected:'[poʊˈspoʊn]'}});
});
