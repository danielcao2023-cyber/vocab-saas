import {expect,it} from 'vitest';
import {createLessonReader} from '../server/src/lessons';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling';
it('provides reviewed Unit 5 opening vocabulary',()=>{
 const read=createLessonReader();
 for(const [id,headword] of [[1855,'billion'],[1856,'native'],[1857,'attitude'],[1858,'reference'],[1859,'refer'],[1860,'refer to']] as const) expect(read({id,headword}).status,headword).toBe('ready');
 for(const word of ['billion','native','attitude','reference','refer']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
it('keeps attributed Unit 5 recordings intact and licensed',async()=>{
 const fs=await import('node:fs');const crypto=await import('node:crypto');
 const manifest=JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json',import.meta.url),'utf8'));
 for(const word of ['reference','means','petrol','subway','pants','vocabulary','Denmark']){
  const entry=manifest.entries[word];expect(entry?.author,word).toBeTruthy();expect(entry?.licenseUrl,word).toMatch(/^https:\/\/creativecommons\.org\//);
  const bytes=fs.readFileSync(new URL('../data/pronunciation/'+entry.file,import.meta.url));expect(crypto.createHash('sha256').update(bytes).digest('hex'),word).toBe(entry.sha256);
 }
});
