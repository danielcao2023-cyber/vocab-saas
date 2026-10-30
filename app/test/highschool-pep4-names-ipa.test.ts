import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const cases=[
 [3821,'Larry Belmont','/ˈlæri ˈbelmɒnt/'],
 [3823,'Gladys Claffern','/ˈɡlædɪs ˈklæfən/'],
 [3900,'Edmonds','/ˈedməndz/'],
 [3955,'Zac Sunderland','/zæk ˈsʌndələnd/'],
 [3956,'Robin Lee Graham','/ˈrɒbɪn liː ˈɡreɪəm/'],
] as const;
for(const [id,headword,ipa] of cases)it(`uses the textbook name pronunciation for ${headword}`,()=>{
 const word={id,headword},r=createLessonReader('data/lessons')(word);
 expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,word).ok).toBe(true);
 expect(r.lesson.pronunciation.ipa).toBe(ipa);
 expect(r.lesson.forms[0].ipa).toBe(ipa);
 expect(r.lesson.sources.some(s=>s.url.includes('1826865835'))).toBe(true);
});
