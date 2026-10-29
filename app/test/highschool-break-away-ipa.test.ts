import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('provides a sourced whole-phrase IPA for the textbook expression break away',()=>{
 const raw=JSON.parse(fs.readFileSync('data/lessons/2126.json','utf8')),word={id:2126,headword:'break away'};
 expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');
 expect(result.lesson?.pronunciation.ipa).toBe('/breɪk əˈweɪ/');expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');
 expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url==='https://learningclub.egis.com.pl/zasoby/de480c75/1_upstream_pre-intermediate_companion.pdf')).toBe(true);
});
