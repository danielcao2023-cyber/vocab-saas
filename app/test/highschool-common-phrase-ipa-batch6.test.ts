import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads sourced full-phrase IPA',()=>{
 const rows=[
 [2424,'a great deal','/ə ɡreɪt diːl/'],
 [2474,'apart from','/əˈpɑːt frɒm/'],
 [2477,'bring about','/brɪŋ əˈbaʊt/'],
 [2541,'carry on','/ˈkæri ɒn/'],
 [2543,'on board','/ˌɒn ˈbɔːd/'],
 [2562,'figure out','/ˌfɪɡər ˈaʊt/'],
 [2575,'result in','/rɪˈzʌlt ɪn/'],
 [2593,'run out','/rʌn aʊt/'],
 [2620,'in return','/ɪn rɪˈtɜːn/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us:''});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
