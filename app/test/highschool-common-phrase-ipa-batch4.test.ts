import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and serves sourced whole-phrase transcriptions',()=>{
 const rows=[
 [2129,'belong to','/bɪˈlɒŋ tə/',''],
 [2130,'as well as','/əz ˈwel əz/',''],
 [2222,'try out','/traɪ aʊt/',''],
 [2234,'get through','/ɡet θruː/',''],
 [2257,'dress up','/dres ʌp/',''],
 [2290,'in spite of','/ɪn ˈspaɪt ɒv/',''],
 [2295,'take advantage of','/teɪk ədˈvɑːntɪdʒ ɒv/','/teɪk ædˈvæntɪdʒ əv/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk,us] of rows){const word={id,headword}; const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8')); expect(validateLesson(raw,word).ok,headword).toBe(true); const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
