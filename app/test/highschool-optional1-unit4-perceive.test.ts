import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 4 perception vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2956,'distract'],[2957,'perceive'],[2958,'distinguish'],[2959,'anxiety'],[2960,'chest'],[2961,'embarrassed'],[2962,'ashamed'],[2963,'merely'],[2964,'call on'],[2965,'bother'],[2966,'weep'],[2967,'at work'],[2968,'conflict'],[2969,'inquire'],[2970,'enquire']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['distract','perceive','distinguish','anxiety','embarrassed','ashamed','merely','bother','inquire','enquire']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
