import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 1 Unit 4 and Unit 5 vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2971,'ultimately'],[2972,'adjust'],[2973,'intervene'],[2974,'react'],[2975,'component'],[2976,'tone'],[2977,'Brazil'],[2978,'Bulgaria'],[2979,'Albania'],[2980,'hybrid'],[2981,'devote'],[2982,'devote ... to'],[2983,'shortage'],[2984,'tackle'],[2985,'crisis']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['ultimately','adjust','intervene','react','component','Brazil','Bulgaria','Albania','hybrid','devote','shortage','tackle','crisis']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
