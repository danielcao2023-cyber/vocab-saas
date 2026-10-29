import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads supported whole-phrase IPA',()=>{
 const rows=[
 [2628,'by accident','/baɪ ˈæksɪdənt/'],
 [2636,'to be honest','/tə biː ˈɒnɪst/'],
 [2646,'in case','/ɪn ˈkeɪs/'],
 [2652,'on duty','/ɒn ˈdjuːti/'],
 [2552,'so as to','/səʊ æz tə/'],
 [2579,'as a result','/æz ə rɪˈzʌlt/'],
 [2614,'on the basis of','/ɒn ðə ˈbeɪsɪs əv/'],
 [2458,'head to','/hed tu/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us:''});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
