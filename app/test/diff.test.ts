import { it,expect } from 'vitest';
import { charDiff } from '../web/src/diff.ts';
import { COPY } from '../web/src/copy.ts';
import { vueSources } from './vue-sources.ts';
it('character diff preserves text and marks substitution, insertion, deletion, transposition and Unicode',()=>{
  for(const [a,b] of [['receive','receive'],['recieve','receive'],['aple','apple'],['appple','apple'],['','x'],['x',''],['🎈a','🎈b']]){
    const d=charDiff(a,b);expect(d.typed.map(c=>c.char).join('')).toBe(a);expect(d.expected.map(c=>c.char).join('')).toBe(b);
    if(a===b)expect(d.typed.every(c=>!c.changed)).toBe(true);else expect([...d.typed,...d.expected].some(c=>c.changed)).toBe(true);
  }
  const swapped=charDiff('recieve','receive');expect(swapped.typed.filter(c=>c.changed).map(c=>c.char).join('')).toBe('ie');expect(swapped.expected.filter(c=>c.changed).map(c=>c.char).join('')).toBe('ei');
});
it('every copy entry is populated; child views/components have no parent route; all Vue sources avoid popups',()=>{
  const check=(value:any)=>{if(typeof value==='string')expect(value.length).toBeGreaterThan(0);else if(typeof value==='function')expect(value(1,2,3,4).length).toBeGreaterThan(0);else Object.values(value).forEach(check);};
  check(COPY);
  for(const source of vueSources()){
    expect(source.text).not.toMatch(/alert\(|confirm\(/);
    if(!source.file.endsWith('/App.vue')&&!source.file.endsWith('/ParentView.vue'))expect(source.text).not.toContain('/parent');
  }
});
