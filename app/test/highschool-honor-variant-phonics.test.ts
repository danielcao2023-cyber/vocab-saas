import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createSSRApp} from 'vue';
import {renderToString} from 'vue/server-renderer';
import SenseLesson from '../web/src/components/SenseLesson.vue';
import SoundSpellingLesson from '../web/src/components/SoundSpellingLesson.vue';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';

it('renders the two actual UK and US spelling choices and preserves pronunciation alignment',async()=>{
 const word={id:664,headword:'honour (AmE honor)'};
 const raw=JSON.parse(readFileSync(join(defaultLessonDir,'664.json'),'utf8'));
 expect(validateLesson(raw,word).ok).toBe(true);
 const result=createLessonReader()(word);expect(result.status).toBe('ready');
 const choices=getSoundSpellingLessons(word.headword);
 expect(choices.map(x=>x.headword)).toEqual(['honour','honor']);
 const uk=choices[0]; expect(uk.ipa).toBe('/ˈɒ.nə/');
 expect(uk.chunks.flatMap(c=>c.pairs.map(p=>p.sound))).toEqual(['','/ɒ/','/n/','/ə/']);
 const us=choices[1];expect(us.ipa).toBe('/ˈɑːnɚ/');
 expect(us.chunks.map(c=>c.letters).join('')).toBe('honor');
 expect(us.chunks.map(c=>c.pairs.map(p=>p.letters).join(''))).toEqual(us.chunks.map(c=>c.letters));
 expect(us.chunks.flatMap(c=>c.pairs.map(p=>p.sound))).toEqual(['','/ɑː/','/n/','/ɚ/']);
 const html=await renderToString(createSSRApp(SenseLesson,{lesson:result.lesson!}));
 expect(html).toContain('aria-label="拼写对照 honour"');
 expect(html).toContain('aria-label="拼写对照 honor"');
 expect(html).toContain('发音与拼写');
 const variantHtml=await renderToString(createSSRApp(SoundSpellingLesson,{lesson:us,recordingWord:'honor'}));
 expect(variantHtml).toContain('/ˈɑːnɚ/');
 expect(variantHtml).toContain('拼写时保留不发音的 h');
 expect(variantHtml).toContain('听整词录音');
});

it('only adds explicit single-word AmE annotations and does not turn other annotations into choices',()=>{
 expect(getSoundSpellingLessons('organise (AmE organize)').map(x=>x.headword)).toEqual(['organise','organize']);
 expect(getSoundSpellingLessons('recognise (AmE recognize)').map(x=>x.headword)).toEqual(['recognise','recognize']);
 expect(getSoundSpellingLessons('medium (pl. media)').map(x=>x.headword)).toEqual(['medium']);
 expect(getSoundSpellingLessons('app (= application)')).toEqual([]);
 expect(getSoundSpellingLessons('honour (AmE honor and other)')).toHaveLength(1);
 expect(getSoundSpellingLessons('honour (AmE honor) (AmE honor)').map(x=>x.headword)).toEqual(['honour','honor']);
});
