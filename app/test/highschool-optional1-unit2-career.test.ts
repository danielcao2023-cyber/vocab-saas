import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 2 career vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2824,'emphasis'],[2825,'luxury'],[2826,'keep in touch'],[2827,'keep in touch with ...'],[2828,'career'],[2829,'prospect'],[2830,'resist'],[2831,'resistance'],[2832,'signpost'],[2833,'essay'],[2834,'accurate'],[2835,'librarian']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['emphasis','luxury','career','prospect','resist','resistance','signpost','essay','accurate','librarian']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
