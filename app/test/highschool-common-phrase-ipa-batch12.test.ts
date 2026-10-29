import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads sourced phrase IPA',()=>{
 const rows=[
 [3601,'dozens of','/ˈdʌzənz əv/'],
 [3666,'make fire','/meɪk ˈfaɪə/'],
 [3786,'pros and cons','/prəʊz ən ˈkɒnz/'],
 [3789,'superior to','/suːˈpɪəriə tə/'],
 [3872,'a flock of','/ə flɒk əv/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us:''});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
