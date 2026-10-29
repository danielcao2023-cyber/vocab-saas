import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads sourced phrase IPA',()=>{
 const rows=[
 [3302,'contrary to','/ˈkɒntrəri tə/'],
 [3507,'rely on','/rɪˈlaɪ ɒn/'],
 [3511,'straight away','/streɪt əˈweɪ/'],
 [3439,'be fond of','/bi fɒnd əv/'],
 [3504,'in response to','/ɪn rɪˈspɒns tə/'],
 [3401,'out of shape','/aʊt əv ʃeɪp/'],
 [3515,'decide on','/dɪˈsaɪd ɒn/'],
 [3518,'be composed of','/bi kəmˈpəʊzd əv/'],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us:''});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
