import {expect,it} from 'vitest';
import catalog from '../data/vocabulary/catalog.json';
import {createLessonReader} from '../server/src/lessons';
it('corrects the abbreviated curriculum expression without replacing its stable catalog key',()=>{
 const entry=catalog.entries.find(e=>e.key==='from on');
 expect(entry).toMatchObject({headword:'from (then) on',headwordCorrection:{expected:'from on'},meaning:'从（那）时起'});
 expect(catalog.version).toBeGreaterThanOrEqual(19);
 expect(createLessonReader()({id:2229,headword:'from (then) on'}).status).toBe('ready');
});
