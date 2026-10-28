import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Book 2 Unit 3 surf vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[2073,'surf'],[2074,'distance'],[2075,'inspire'],[2076,'now that'],[2077,'access'],[2078,'go through'],[2079,'tough'],[2080,'province'],[2081,'conference'],[2082,'resident'],[2083,'plus'],[2084,'function']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['distance','inspire','access','province','conference','resident','function']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
