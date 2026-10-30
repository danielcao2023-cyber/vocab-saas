import {expect,it} from 'vitest';
import {createSSRApp} from 'vue';
import {renderToString} from 'vue/server-renderer';
import SoundSpellingLesson from '../web/src/components/SoundSpellingLesson.vue';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';

async function render(word:string){
 const lesson=getSoundSpellingLesson(word)!;
 return renderToString(createSSRApp(SoundSpellingLesson,{lesson}));
}
it('explains sth. as a replaceable expression rather than a silent letter or unstressed sound',async()=>{
 const html=await render('sign up for sth.');
 expect(html).toMatch(/class="chunk-stress"[^>]*>可替换内容<\/span>/);
 expect(html).toMatch(/<b[^>]*>sth\.<\/b><span[^>]*>填入具体内容<\/span>/);
 expect(html).not.toMatch(/<b[^>]*>sth\.<\/b><span[^>]*>不单独发音<\/span>/);
 expect(html).toMatch(/<b[^>]*>g<\/b><span[^>]*>不单独发音<\/span>/);
});
it('identifies ellipses inside real spoken chunks without changing their stress',async()=>{
 const html=await render('prefer ... to ...');
 expect(html.match(/填入具体内容/g)).toHaveLength(2);
 expect(html).toMatch(/class="chunk-stress"[^>]*>重读<\/span>/);
 expect(html).toMatch(/class="chunk-stress"[^>]*>轻读<\/span>/);
 expect(html).not.toMatch(/<b[^>]*>\s*\.\.\.\s*<\/b><span[^>]*>不单独发音<\/span>/);
});
