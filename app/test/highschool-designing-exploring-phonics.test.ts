import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {createSSRApp} from 'vue';
import {renderToString} from 'vue/server-renderer';
import SenseLesson from '../web/src/components/SenseLesson.vue';
import {createLessonReader,validateLesson} from '../server/src/lessons';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
it('renders only actual, reviewed -ing forms as choices on the corresponding real lesson',async()=>{
 for(const [id,headword,form] of [[372,'design','designing'],[482,'explore','exploring']] as const){
  const word={id,headword},raw=JSON.parse(readFileSync(`data/lessons/${id}.json`,'utf8'));expect(validateLesson(raw,word).ok).toBe(true);
  const result=createLessonReader()(word);expect(result.status).toBe('ready');
  expect(await renderToString(createSSRApp(SenseLesson,{lesson:result.lesson!}))).toContain(`aria-label="拼写对照 ${form}"`);
  const filtered={...result.lesson!,forms:result.lesson!.forms.filter(x=>x.form!==form)};
  expect(await renderToString(createSSRApp(SenseLesson,{lesson:filtered}))).not.toContain(`aria-label="拼写对照 ${form}"`);
 }
});
it('preserves Oxford IPA, letter mapping, sounds and stress for each form',()=>{
 for(const [word,ipa,sounds] of [['designing','/dɪˈzaɪnɪŋ/','dɪzaɪnɪŋ'],['exploring','/ɪkˈsplɔːrɪŋ/','ɪksplɔːrɪŋ']] as const){
  const l=getSoundSpellingLessons(word)[0];expect(l?.ipa).toBe(ipa);expect(l.chunks.map(c=>c.letters).join('')).toBe(word);expect(l.chunks.flatMap(c=>c.pairs).map(p=>p.letters).join('')).toBe(word);expect(l.chunks.flatMap(c=>c.pairs).map(p=>p.sound.replaceAll('/','')).join('')).toBe(sounds);expect(l.chunks.map(c=>c.stress)).toEqual(['none','primary','none']);expect(l.sources[0].url).toContain('oxfordlearnersdictionaries.com');
 }
});
