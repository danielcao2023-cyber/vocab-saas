import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const cases = [
 [13112,'Butchart Gardens','Butchart 部分读作 /ˈbʊtʃɑːt/','不包含 Gardens'],
 [3333,'St Lawrence River','Lawrence 部分读作 /ˈlɒrəns/','不包含 St 和 River'],
] as const;
for(const [id,headword,partial,warning] of cases) it(`shows the textbook partial IPA for ${headword}`,()=>{
 const word={id,headword},result=createLessonReader('data/lessons')(word);
 expect(result.status).toBe('ready'); if(result.status!=='ready') throw new Error('missing');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect(result.lesson.takeaway).toContain(partial);
 expect(result.lesson.takeaway).toContain(warning);
 expect(result.lesson.pronunciation.ipa).toBe('');
 expect(result.lesson.forms[0].ipa).toBe('');
 expect(result.lesson.sources.some(s=>s.url.includes('1826865835'))).toBe(true);
});
