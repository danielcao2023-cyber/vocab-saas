import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
it('shows the textbook pronunciation of Giverny with language caveat',()=>{
 const w={id:3491,headword:'Giverny'},r=read(w);expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,w).ok).toBe(true);expect(r.lesson.pronunciation.ipa).toBe('/dʒɪˈveni/');expect(r.lesson.forms[0].ipa).toBe('/dʒɪˈveni/');expect(r.lesson.takeaway).toMatch(/教材.*法语.*不同/);
});
for(const [id,headword,partial,warning] of [[3676,'South Georgia Island','Georgia 部分读作 /ˈdʒɔːdʒə/','不包含 South 和 Island'],[3896,'Bondi Beach','Bondi 部分读作 /ˈbɒndaɪ/','不包含 Beach']] as const)it(`shows only sourced partial IPA for ${headword}`,()=>{
 const w={id,headword},r=read(w);expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');expect(validateLesson(r.lesson,w).ok).toBe(true);
 expect(r.lesson.takeaway).toContain(partial);expect(r.lesson.takeaway).toContain(warning);expect(r.lesson.pronunciation.ipa).toBe('');expect(r.lesson.forms[0].ipa).toBe('');
});
