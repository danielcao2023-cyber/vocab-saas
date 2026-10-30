import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read=createLessonReader('data/lessons');
for(const [id,headword,ipa,note,url] of [
 [3914,"in a league of one's own",'league 部分：/liːɡ/','不包含其他部分','definition/english/league'],
 [3386,"help sb. to one's feet",'feet 部分：/fiːt/','不包含其他部分','definition/english/foot_1'],
 [3869,'sulphuric pool','sulphuric 部分：/sʌlˈfjʊə.rɪk/','不包含 pool','pronunciation/english/sulfuric'],
] as const){
 it(`labels partial pronunciation for ${headword}`,()=>{const word={id,headword};const r=read(word);expect(r.status).toBe('ready');if(r.status!=='ready')throw Error('missing');expect(validateLesson(r.lesson,word).ok).toBe(true);expect(r.lesson.pronunciation.ipa).toBe(ipa);expect(r.lesson.forms[0].ipa).toBe(ipa);expect(r.lesson.takeaway).toContain(note);expect(r.lesson.sources.some(s=>s.url.includes(url))).toBe(true);});
}
