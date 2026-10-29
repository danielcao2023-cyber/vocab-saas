import {expect,it} from 'vitest';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it.each([[2048,'search for','/ˈsɜːtʃ fɔː/'],[2090,'in shape','/ɪn ˈʃeɪp/']] as const)('reads sourced full phrase IPA %s',(id,headword,ipa)=>{
 const r=createLessonReader('data/lessons')({id,headword});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id,headword}).ok).toBe(true);expect(r.lesson.pronunciation.ipa).toBe(ipa);expect(r.lesson.pronunciation.uk).toBe(ipa);expect(r.lesson.pronunciation.sourceIds).toContain('phrase-ipa-publisher');
});
