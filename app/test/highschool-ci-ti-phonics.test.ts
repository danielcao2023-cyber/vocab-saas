import {expect, it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';
const ci = ['commercial','commercialise','commercialisation','commercialization','precious','financial','sufficient','crucial','efficient','artificial','socialist','proficiency'];
const ti = ['potentially','potential','essential','substantial','initial','initiative'];
it.each([...ci.map(word=>[word,'ci']),...ti.map(word=>[word,'ti'])])('%s groups %s as /ʃ/', (word, letters) => {
 const lesson=getSoundSpellingLesson(word); expect(lesson).toBeDefined();
 const pairs=lesson!.chunks.flatMap(chunk=>chunk.pairs);
 expect(pairs).toContainEqual({letters,sound:'/ʃ/'});
});
