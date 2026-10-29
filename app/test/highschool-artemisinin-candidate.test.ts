import { expect,it } from 'vitest';
import { highschoolArtemisinin } from '../web/src/content/sound-spelling/highschool-artemisinin';
it('records the sourced British pronunciation and complete letter mapping',()=>{
 const l=highschoolArtemisinin[0];expect(l.headword).toBe('artemisinin');expect(l.ipa).toBe('/ˌɑːtɪˈmɪzɪnɪn/');expect(l.chunks.map(c=>c.letters).join('')).toBe(l.headword);
 for(const c of l.chunks){expect(c.pairs.map(p=>p.letters).join('')).toBe(c.letters);expect(c.pairs.map(p=>p.sound).join('').replace(/[\/ˈˌ.\s]/g,'')).toBe(c.sound.replace(/[\/ˈˌ.\s]/g,''));}
 expect(l.chunks.filter(c=>c.stress==='primary').map(c=>c.letters)).toEqual(['mi']);expect(l.chunks.filter(c=>c.stress==='secondary').map(c=>c.letters)).toEqual(['ar']);
});
