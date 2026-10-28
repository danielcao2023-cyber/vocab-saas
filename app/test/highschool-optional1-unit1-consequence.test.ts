import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 1 consequence vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2741,'consequence'],[2742,'moustache'],[2743,'mustache'],[2744,'peculiarity'],[2745,'encounter'],[2746,'professor'],[2747,'mourn'],[2748,'remarkable'],[2749,'device'],[2750,'sum'],[2751,'sum up'],[2752,'draft']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['consequence','moustache','mustache','peculiarity','encounter','professor','remarkable','device']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
