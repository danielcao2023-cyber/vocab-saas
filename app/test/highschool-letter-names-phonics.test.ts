import {expect,it} from 'vitest';
import {createSSRApp} from 'vue';
import {renderToString} from 'vue/server-renderer';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
import SenseLesson from '../web/src/components/SenseLesson.vue';

it.each([
 ['GPS','/ˌdʒiː piː ˈes/',['G','P','S'],['/dʒiː/','/piː/','/es/']],
 ['CPR','/ˌsiː piː ˈɑːr/',['C','P','R'],['/siː/','/piː/','/ɑːr/']],
])('%s uses letter names and opens the sound-spelling tab',async(word,ipa,letters,sounds)=>{
 const map=getSoundSpellingLessons(word)[0];expect(map).toBeDefined();expect(map.ipa).toBe(ipa);expect(map.chunks.map(c=>c.letters)).toEqual(letters);expect(map.chunks.map(c=>c.pairs[0].sound)).toEqual(sounds);expect(map.chunks.map(c=>c.stress)).toEqual(['secondary','none','primary']);expect(map.variantNote).toContain('字母名称');
 const entry={id:word==='GPS'?2611:3406,headword:word};const lesson=createLessonReader()(entry).lesson!;const html=await renderToString(createSSRApp(SenseLesson,{lesson}));expect(html).toContain('发音与拼写');expect(html).toContain('字母名称');
});
it('CPR distinguishes British and American R',()=>{const map=getSoundSpellingLessons('CPR')[0];expect(map.uk).toBe('/ˌsiː piː ˈɑː/');expect(map.variantNote).toContain('美式');expect(map.variantNote).toContain('英式');});
