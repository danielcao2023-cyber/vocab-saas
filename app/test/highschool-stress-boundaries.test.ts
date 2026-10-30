import {expect,it} from 'vitest';
import {createSSRApp} from 'vue';
import {renderToString} from 'vue/server-renderer';
import SoundSpellingLesson from '../web/src/components/SoundSpellingLesson.vue';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

const words=['experiment','explore','extremely','establish','extinct','extinction','exist','historical','extent','external','extract','extraordinary','display'];
const normalize=(value:string)=>value.replace(/[/.\sˈˌ]/g,'');
it.each(words)('%s marks the spelling block that crosses its stress boundary',word=>{
 const lesson=getSoundSpellingLesson(word)!;
 const chunk=lesson.chunks.find(part=>part.crossesStressBoundary);
 expect(chunk).toBeDefined();
 expect(chunk!.sound).toContain('ˈ');
 expect(chunk!.pairs.some(pair=>pair.sound.includes('ˈ'))).toBe(true);
 expect(lesson.chunks.map(part=>part.letters).join('')).toBe(word);
 expect(normalize(lesson.chunks.flatMap(part=>part.pairs).map(pair=>pair.sound).join(''))).toBe(normalize(lesson.ipa));
 expect(lesson.sources.some(source=>source.url.includes('dictionary.cambridge.org'))).toBe(true);
});
it('shows the shared spelling block as crossing stress to the learner',async()=>{
 const lesson=getSoundSpellingLesson('experiment')!;
 const html=await renderToString(createSSRApp(SoundSpellingLesson,{lesson}));
 expect(html).toMatch(/class="chunk-stress"[^>]*>跨重音<\/span>/);
 expect(html).toContain('/kˈs/');
});
