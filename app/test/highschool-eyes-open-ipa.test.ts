import {expect,it} from 'vitest';
import fs from 'node:fs';
import {createLessonReader,validateLesson} from '../server/src/lessons';
it('exposes the whole textbook phrase pronunciation and its source',()=>{const word={id:2143,headword:'keep your eyes open'},raw=JSON.parse(fs.readFileSync('data/lessons/2143.json','utf8'));expect(validateLesson(raw,word).ok).toBe(true);const result=createLessonReader()(word);expect(result.status).toBe('ready');expect(result.lesson?.pronunciation.ipa).toBe('/kiːp jɔː(r) aɪz ˈəʊpən/');expect(result.lesson?.pronunciation.sourceIds).toContain('phrase-ipa');expect(result.lesson?.sources.some(s=>s.id==='phrase-ipa'&&s.url==='https://pdfcoffee.com/business-result-advanced-glossary11-pdf-free.html')).toBe(true);});
