import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads sourced complete-phrase IPA',()=>{
 const rows=[
 [2101,'make fun of','/meɪk fʌn ɒv/',''],
 [2106,'keep in mind','/kiːp ɪn ˈmaɪnd/',''],
 [1964,'all over the world','/ˌɔːl ˌəʊvə ðə ˈwɜːld/',''],
 [2329,'set off','/set ɒf/',''],
 [3077,'thanks to','/θæŋks tə/',''],
 [2405,'first aid','/ˌfɜːst ˈeɪd/','/ˌfɝːst ˈeɪd/'],
 [2406,'pass away','/pɑːs əˈweɪ/',''],
 [2409,'in memory of','/ˌɪn ˈmeməri əv/',''],
 [2418,'trip over','/trɪp ˈəʊvə/',''],
 [2421,'in tears','/ɪn ˈtɪəz/',''],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk,us] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
