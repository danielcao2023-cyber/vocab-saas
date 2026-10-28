import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
import catalog from '../data/vocabulary/catalog.json';
it('provides optional Book 1 Unit 1 academic vocabulary and distinguishes extract stresses',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2693,'commit'],[2694,'academy'],[2695,'academic'],[2696,'objective'],[2697,'botanical'],[2698,'evaluate'],[2699,'property'],[2700,'distinct'],[2701,'extract'],[2702,'wormwood'],[2703,'liquid'],[2704,'obtain'],[2705,'acknowledge'],[2706,'defeat'],[2707,'analyse'],[2708,'analyze']] as const) {expect(read({id,headword}).status,headword).toBe('ready');expect(getSoundSpellingLesson(headword),headword).toBeDefined();}
 expect(catalog.entries.find(e=>e.headword==='extract')).toMatchObject({phonetic:'/ɪkˈstrækt/（动词）；/ˈekstrækt/（名词）',phoneticCorrection:{expected:'[ˈekstrækt]'}});
});
