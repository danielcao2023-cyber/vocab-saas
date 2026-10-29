import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createLessonReader, defaultLessonDir, validateLesson } from '../server/src/lessons';
it('serves source-supported complete phrase transcriptions', () => {
 const rows = [
 [1636,'flash card','/ˈflæʃ ˌkɑːd/','/ˈflæʃ ˌkɑːrd/'],
 [2173,'Northern Ireland','/ˌnɔːðən ˈaɪələnd/','/ˌnɔːrðɚn ˈaɪrlənd/'],
 [2174,'Anglo-Saxon','/ˌæŋɡləʊˈsæksən/','/ˌæŋɡloʊˈsæksən/'],
 [2312,'mashed potatoes','/ˌmæʃt pəˈteɪtəʊz/','/ˌmæʃt pəˈteɪt̬oʊz/'],
 [2225,'in addition','/ɪn əˈdɪʃən/',''],
 [2265,'after all','/ˌɑːftər ˈɔːl/',''],
 [1993,'die out','/daɪ aʊt/',''],
 [2003,'on average','/ɒn ˈævərɪdʒ/',''],
 [2309,'Merry Christmas!','/ˌmeri ˈkrɪsməs/',''],
 ] as const;
 const read = createLessonReader();
 for(const [id,headword,uk,us] of rows){
   const word={id,headword};
   const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));
   expect(validateLesson(raw,word).ok,headword).toBe(true);
   const result=read(word); expect(result.status,headword).toBe('ready');
   expect(result.lesson?.pronunciation).toMatchObject({uk,us,sourceIds:['pronunciation-phrase']});
 }
});
