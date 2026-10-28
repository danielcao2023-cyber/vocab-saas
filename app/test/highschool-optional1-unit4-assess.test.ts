import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 4 assessment vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2926,'fake'],[2927,'anger'],[2928,'reliable'],[2929,'incident'],[2930,'trial'],[2931,'slight'],[2932,'slightly'],[2933,'twin'],[2934,'nonverbal'],[2935,'assessment'],[2936,'assess'],[2937,'internal'],[2938,'straighten up'],[2939,'slump'],[2940,'pose']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['anger','reliable','incident','trial','slightly','nonverbal','assessment','assess','internal']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
