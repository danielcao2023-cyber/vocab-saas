import {expect,it} from 'vitest';
import {createSSRApp} from 'vue';
import {renderToString} from 'vue/server-renderer';
import SoundSpellingLesson from '../web/src/components/SoundSpellingLesson.vue';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

it('omits the gap between phrase words while retaining the hint for a silent letter',async()=>{
 const phrase=getSoundSpellingLesson('roast turkey')!;
 const phraseHtml=await renderToString(createSSRApp(SoundSpellingLesson,{lesson:phrase}));
 expect(phraseHtml).toContain('roast');
 expect(phraseHtml).toContain('tur');
 expect(phraseHtml).not.toContain('不单独发音');

 const word=getSoundSpellingLesson('honor')!;
 const wordHtml=await renderToString(createSSRApp(SoundSpellingLesson,{lesson:word}));
 expect(wordHtml).toMatch(/<b[^>]*>h<\/b><span[^>]*>不单独发音<\/span>/);
});
