import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 5 yield vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2986,'boost'],[2987,'yield'],[2988,'convince'],[2989,'attain'],[2990,'conventional'],[2991,'pollinate'],[2992,'assumption'],[2993,'intense'],[2994,'overcome'],[2995,'overcame'],[2996,'expand'],[2997,'output'],[2998,'estimate'],[2999,'domestic'],[3000,'consumption']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['convince','attain','conventional','pollinate','assumption','intense','overcome','overcame','output','estimate','domestic','consumption']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
