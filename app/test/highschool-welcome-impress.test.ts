import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Welcome Unit impress vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1621,'impress'],[1622,'make an impression'],[1623,'what if'],[1624,'guy'],[1625,'concentrate'],[1626,'concentrate on'],[1627,'experiment'],[1628,'leave ... alone'],[1629,'awkward'],[1630,'junior high school'],[1631,'confident']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['impress','guy','concentrate','experiment','awkward','confident']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
