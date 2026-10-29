import {expect,it} from 'vitest';
import catalog from '../data/vocabulary/catalog.json';
import type {Membership} from '../server/src/vocabulary-import.ts';
import {createLessonReader,validateLesson} from '../server/src/lessons.ts';
it('retains Lao Zi as a Unit 2 text-based extension with readable lesson',()=>{
 const entry=catalog.entries.find(e=>e.key==='Lao Zi'); expect(entry?.headword).toBe('Lao Zi');
 expect(entry?.memberships.some((m:Membership)=>m.unitId==='pep2019-optional-3:unit2')).toBe(true);
 const r=createLessonReader('data/lessons')({id:3548,headword:'Lao Zi'});expect(r.status).toBe('ready');if(r.status!=='ready')throw new Error('missing');
 expect(validateLesson(r.lesson,{id:3548,headword:'Lao Zi'}).ok).toBe(true);
});
