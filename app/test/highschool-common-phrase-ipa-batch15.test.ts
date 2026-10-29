import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads sourced phrase IPA',()=>{
 const rows=[
 [3588,'on behalf','/ɒn bɪˈhɑːf/',''],
 [2463,'earn a living','/ɜːn ə ˈlɪvɪŋ/',''],
 [2499,'at first hand','/ət fɜːst hænd/',''],
 [2498,'first hand','/fɜːst hænd/','/ˈfɜrst hænd/'],
 [2365,'tuition fees','/tjuːˈɪʃən fiːz/',''],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk,us] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
