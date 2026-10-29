import {expect,it} from 'vitest';
import fs from 'node:fs';
import {vocabularyFile} from '../server/src/vocabulary-file';
import type {Catalog} from '../server/src/vocabulary-import';
it('ships seven complete 2019 PEP books with verified unit starts and six exam books',()=>{
 const c=JSON.parse(fs.readFileSync(vocabularyFile,'utf8')) as Catalog;
 expect(c.books.filter(b=>b.category==='high')).toHaveLength(7);expect(c.books.filter(b=>b.category==='exam').map(b=>b.id)).toEqual(['cet4','cet6','kaoyan','toefl','ielts','gre']);expect(c.units).toHaveLength(36);expect(c.entries).toHaveLength(12073);
 const expected=[['pep2019-compulsory-1',['exchange','teenage','castle','fitness','disaster','billion']],['pep2019-compulsory-2',['heritage','poster','blog','Confucius','classical']],['pep2019-compulsory-3',['lantern','moral','diverse','astronaut','basis']],['pep2019-optional-1',['physiology','phrase','buffet','interaction','hybrid']],['pep2019-optional-2',['cholera','complex','cuisine','airline','technique']],['pep2019-optional-3',['precise','tobacco','graph','adversity','drama']],['pep2019-optional-4',['fiction','iconic','tale','parcel','bounce']]] as const;
 for(const [id,starts] of expected){const units=c.units.filter(u=>u.bookId===id);expect(units).toHaveLength(starts.length);for(let i=0;i<units.length;i++){const entries=c.entries.flatMap(e=>e.memberships.filter(m=>m.bookId===id&&m.unitId===units[i].id).map(m=>({headword:e.headword,position:m.position}))).sort((a,b)=>a.position-b.position);expect(entries.length).toBeGreaterThan(0);expect(entries[0].headword).toBe(starts[i]);}}
 for(const e of c.entries){expect(e.meaning.trim()).not.toBe('');expect(e.memberships.every(m=>c.books.some(b=>b.id===m.bookId)&&(m.unitId===null||c.units.some(u=>u.id===m.unitId&&u.bookId===m.bookId)))).toBe(true);}
});
