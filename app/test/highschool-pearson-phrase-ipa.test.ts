import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
const source='https://www.venturesbooks.cz/ke-stazeni/category/159-materialy-k-ucebnicim-pearson?download=1762:focus4-se-cz-slovnicek';
it.each([[1622,'make an impression','/ˌmeɪk ən ɪmˈpreʃən/'],[2202,'fall in love with','/ˌfɔːl ɪn ˈlʌv wɪð/']] as const)('provides sourced complete phrase IPA for %s %s',(id,headword,ipa)=>{
 const raw=JSON.parse(fs.readFileSync(`data/lessons/${id}.json`,'utf8')),word={id,headword};expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');expect(result.lesson?.pronunciation.ipa).toBe(ipa);expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url===source)).toBe(true);
});
