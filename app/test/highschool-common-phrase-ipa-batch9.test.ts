import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads source-supported phrase IPA',()=>{
 const rows=[
 [2826,'keep in touch','/kiːp ɪn tʌtʃ/',''],
 [2854,'set out','/set aʊt/',''],
 [2856,'live off','/ˈlɪv ɒf/',''],
 [2879,'appeal to','/əˈpiːl tə/',''],
 [2909,'by contrast','/baɪ ˈkɒntrɑːst/',''],
 [2924,'break down','/breɪk daʊn/',''],
 [2945,'in other words','/ɪn ˈʌðə wɜːdz/',''],
 [2918,'by comparison','','/baɪ kəmˈpærɪsən/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk,us] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
