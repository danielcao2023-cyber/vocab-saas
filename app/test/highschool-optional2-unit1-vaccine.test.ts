import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides optional Book 2 Unit 1 scientific vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[3076,'decrease'],[3077,'thanks to'],[3078,'statistic'],[3079,'transform'],[3080,'epidemiology'],[3081,'microscope'],[3082,'thinking'],[3083,'protein'],[3084,'cell'],[3085,'finding'],[3086,'initial'],[3087,'vaccine'],[3088,'framework'],[3089,'theoretical framework'],[3090,'solid']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['decrease','statistic','transform','epidemiology','microscope','thinking','protein','finding','initial','vaccine','framework','solid']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
