import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides Book 3 Unit 2 moral vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2351,'moral'],[2352,'virtue'],[2353,'dilemma'],[2354,'moral dilemma'],[2355,'faint'],[2356,'illustrate'],[2357,'precious'],[2358,'entrust']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['moral','virtue','dilemma','illustrate','precious','entrust']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
