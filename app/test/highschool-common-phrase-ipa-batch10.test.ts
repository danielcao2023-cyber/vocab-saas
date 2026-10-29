import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads sourced phrase IPA',()=>{
 const rows=[
 [2964,'call on','/kɔːl ɒn/'],
 [3062,'subscribe to','/səbˈskraɪb tə/'],
 [3099,'break out','/ˌbreɪk ˈaʊt/'],
 [3110,'come down','/kʌm daʊn/'],
 [3150,'get involved in','/ɡet ɪnˈvɒlvd ɪn/'],
 [3143,'participate in','/pɑːˈtɪsɪpeɪt ɪn/'],
 [3148,'engage in','/ɪnˈɡeɪdʒ ɪn/'],
 [3208,'consist of','/kənˈsɪst əv/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us:''});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
