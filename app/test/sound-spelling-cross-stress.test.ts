import {expect,it} from 'vitest';
import {createSSRApp,h} from 'vue';
import {renderToString} from 'vue/server-renderer';
import SoundSpellingLesson from '../web/src/components/SoundSpellingLesson.vue';
it('shows a shared letter sound crossing the stress boundary without calling the whole piece unstressed',async()=>{
 const lesson={headword:'expand',ipa:'/ɪkˈspænd/',chunks:[
  {letters:'ex',sound:'/ɪkˈs/',stress:'none',crossesStressBoundary:true,hint:'x 的 /ks/ 跨重音。',tip:'重音从 /s/ 开始。',pairs:[{letters:'e',sound:'/ɪ/'},{letters:'x',sound:'/kˈs/'}]},
  {letters:'pand',sound:'/pænd/',stress:'primary',hint:'重读元音 /æ/。',tip:'a 对应 /æ/。',pairs:[{letters:'p',sound:'/p/'},{letters:'a',sound:'/æ/'},{letters:'n',sound:'/n/'},{letters:'d',sound:'/d/'}]}
 ],anchor:{text:'结合读音记忆。'},sources:[],review:{status:'reviewed',reviewedAt:'2026-10-29',draftedBy:'test'}};
 const html=await renderToString(createSSRApp({render:()=>h(SoundSpellingLesson,{lesson})}));
 expect(html).toMatch(/class="chunk-stress"[^>]*>跨重音<\/span>/);expect(html).toContain('/ɪkˈs/');expect(html).toContain('/kˈs/');
 expect(html).toContain('重读');
});

import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it.each([
 ['expand','/ɪkˈspænd/'],['extension','/ɪkˈstenʃən/'],
 ['exposure','/ɪkˈspoʊʒər/'],['expose','/ɪkˈspoʊz/'],
 ['expense','/ɪkˈspens/'],['expansion','/ɪkˈspænʃən/'],['examine','/ɪɡˈzæmɪn/'],
])('preserves the shared x and exact stress boundary for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word)!;
 expect(lesson.ipa).toBe(ipa);
 const shared=lesson.chunks.find(c=>c.crossesStressBoundary)!;
 expect(shared.letters).toBe('ex');
 expect(shared.pairs.find(p=>p.letters==='x')?.sound).toMatch(/ˈ/);
 expect(lesson.chunks.map(c=>c.letters).join('')).toBe(word);
 expect(lesson.chunks.map(c=>c.sound.replaceAll('/','')).join('')).toBe(ipa.replaceAll('/',''));
});
it('keeps the c in exceptional audible instead of incorrectly assigning /s/ to x',()=>{
 const lesson=getSoundSpellingLesson('exceptional')!;
 expect(lesson.ipa).toBe('/ɪkˈsepʃənəl/');
 expect(lesson.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='x')?.sound).toBe('/k/');
 expect(lesson.chunks.flatMap(c=>c.pairs).find(p=>p.letters==='c')?.sound).toBe('/s/');
});
it('places the two stresses in expectation according to its pronunciation',()=>{
 const lesson=getSoundSpellingLesson('expectation')!;
 expect(lesson.ipa).toBe('/ˌekspekˈteɪʃən/');
 expect(lesson.chunks.find(c=>c.stress==='secondary')?.letters).toBe('ex');
 expect(lesson.chunks.find(c=>c.stress==='primary')?.letters).toBe('ta');
});
