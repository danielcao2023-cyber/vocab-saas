import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createSSRApp} from 'vue';
import {renderToString} from 'vue/server-renderer';
import SenseLesson from '../web/src/components/SenseLesson.vue';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('renders reviewed related forms from the actual curious lesson',async()=>{
 const word={id:347,headword:'curious'};const raw=JSON.parse(readFileSync(join(defaultLessonDir,'347.json'),'utf8'));
 expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');
 const html=await renderToString(createSSRApp(SenseLesson,{lesson:result.lesson!}));
 for(const form of ['curious','curiously','curiosity'])expect(html).toContain(`aria-label="拼写对照 ${form}"`);
 const filtered={...result.lesson!,forms:result.lesson!.forms.filter(x=>x.form!=='curiosity')};
 const filteredHtml=await renderToString(createSSRApp(SenseLesson,{lesson:filtered}));
 expect(filteredHtml).not.toContain('aria-label="拼写对照 curiosity"');
});
it('preserves source spelling, IPA segments and stress for both forms',()=>{
 for(const [word,ipa,stresses] of [['curiously','/ˈkjʊəriəsli/',['primary','none','none']],['curiosity','/ˌkjʊəriˈɒsəti/',['secondary','primary','none']]] as const){
  const l=getSoundSpellingLessons(word)[0];expect(l.headword).toBe(word);expect(l.ipa).toBe(ipa);
  expect(l.chunks.map(c=>c.letters).join('')).toBe(word);
  expect(l.chunks.map(c=>c.pairs.map(p=>p.letters).join(''))).toEqual(l.chunks.map(c=>c.letters));
  expect(l.chunks.map(c=>c.stress)).toEqual(stresses);
 }
});
