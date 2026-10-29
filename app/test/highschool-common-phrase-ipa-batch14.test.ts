import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads supported whole-phrase IPA',()=>{
 const rows=[
 [2001,'aware of','/əˈweə əv/'],
 [2091,'keep track of','/kiːp træk əv/'],
 [2319,'go off','/ɡəʊ ɒf/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us:''});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
