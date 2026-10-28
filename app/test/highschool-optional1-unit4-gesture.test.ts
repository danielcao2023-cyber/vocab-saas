import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 4 gesture vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2911,'demonstrate'],[2912,'gesture'],[2913,'witness'],[2914,'employ'],[2915,'identical'],[2916,'interpret'],[2917,'differ'],[2918,'by comparison'],[2919,'cheek'],[2920,'favour'],[2921,'bow'],[2922,'waist'],[2923,'make inferences'],[2924,'break down'],[2925,'barrier']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['demonstrate','gesture','witness','employ','identical','interpret','differ','favour','barrier']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
