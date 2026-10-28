import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Welcome Unit exchange vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1601,'exchange'],[1602,'lecture'],[1603,'registration'],[1604,'register'],[1605,'sex'],[1606,'female'],[1607,'male'],[1608,'nationality'],[1609,'designer'],[1610,'campus']] as const){expect(read({id,headword}).status,headword).toBe('ready');expect(getSoundSpellingLesson(headword),headword).toBeDefined();}
});
