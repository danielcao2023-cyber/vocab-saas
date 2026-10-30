import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
for(const [id,headword,ipa,note,source] of [
 [2433,'the Wenhai Scholarship','scholarship 单独读音：/ˈskɒləʃɪp/','不包含 the Wenhai','definition/english/scholarship'],
 [3203,'the Belt and Road Initiative','initiative 单独读音：/ɪˈnɪʃətɪv/','不包含 the Belt and Road','definition/english/initiative'],
] as const){
 it(`shows limited dictionary reading for ${headword}`,()=>{const word={id,headword};const r=read(word);expect(r.status).toBe('ready');if(r.status!=='ready')throw Error('missing');expect(validateLesson(r.lesson,word).ok).toBe(true);expect(r.lesson.pronunciation.ipa).toBe(ipa);expect(r.lesson.forms[0].ipa).toBe(ipa);expect(r.lesson.takeaway).toContain(note);expect(r.lesson.sources.some(s=>s.url.includes(source))).toBe(true);});
}
