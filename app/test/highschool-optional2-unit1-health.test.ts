import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 closing and Book 2 Unit 1 health vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[3046,'aspect'],[3047,'Vietnam'],[3048,'LED'],[3049,'light-emitting diode'],[3050,'DDT'],[3051,'cholera'],[3052,'severe'],[3053,'diarrhoea'],[3054,'dehydration'],[3055,'frustrated'],[3056,'once and for all'],[3057,'contradictory'],[3058,'infection'],[3059,'infect'],[3060,'germ']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['aspect','Vietnam','cholera','severe','diarrhoea','dehydration','frustrated','contradictory','infection','infect']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
