import {expect,it} from 'vitest';
import {getSoundSpellingLessons} from '../web/src/content/sound-spelling';
it('serves complete British dictionary mappings for variable vowel sequences without forcing syllable counts',()=>{
 for(const [word,ipa,sounds] of [['hire','/haɪə/','haɪə'],['wire','/waɪə/','waɪə'],['sour','/saʊə/','saʊə']]){
  const lesson=getSoundSpellingLessons(word).find(l=>l.headword===word);expect(lesson,word).toBeDefined();expect(lesson!.uk).toBe(ipa);expect(lesson!.chunks.flatMap(c=>c.pairs).map(p=>p.letters).join('')).toBe(word);expect(lesson!.chunks.flatMap(c=>c.pairs).map(p=>p.sound.replaceAll('/','')).join('')).toBe(sounds);expect(lesson!.variantNote).toContain('音节划分');expect(lesson!.sources[0].url).toContain('cambridge.org/pronunciation');
 }
});
