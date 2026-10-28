import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 3 places and Unit 4 interaction vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2896,'splendid'],[2897,'display'],[2898,'appetite'],[2899,'entertainment'],[2900,'column'],[2901,'Sarek National Park'],[2902,'Sweden'],[2903,'the Arctic Circle'],[2904,'Siberian'],[2905,'Dollywood'],[2906,'interaction'],[2907,'vary'],[2908,'appropriate'],[2909,'by contrast'],[2910,'approve']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['splendid','display','appetite','entertainment','column','Sweden','Siberian','interaction','vary','appropriate','approve']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
