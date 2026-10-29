import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads supported whole phrase IPA',()=>{
 const rows=[
 [2663,'in that case','/ɪn ðæt keɪs/',''],
 [2712,'insist on','/ɪnˈsɪst ɒn/',''],
 [2715,'wear and tear','/ˌweər ən ˈteə/','/ˌwer ən ˈter/'],
 [2751,'sum up','/sʌm ʌp/',''],
 [2766,'switch off','/swɪtʃ ɒf/',''],
 [2767,'switch on','/swɪtʃ ɒn/',''],
 [2800,'catch fire','/kætʃ ˈfaɪə/',''],
 [2850,'on the move','/ɒn ðə ˈmuːv/',''],
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,uk,us] of rows){const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));expect(validateLesson(raw,word).ok,headword).toBe(true);const result=read(word);expect(result.status,headword).toBe('ready');expect(result.lesson?.pronunciation).toMatchObject({uk,us});expect(result.lesson?.pronunciation.sourceIds).toContain('pronunciation-phrase');}
});
