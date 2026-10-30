import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {recordingRequirement,type AudioExemption} from '../scripts/lib/recording-requirement.ts';

const {entries} = JSON.parse(readFileSync('data/pronunciation/highschool-audio-exemptions.json','utf8')) as {entries: Record<string, AudioExemption>};

it('keeps lexical words required, including compounds, borrowings and capitalized language names',()=>{
  for (const word of ['government','upper-class','Arabic','Kazak','café','résumé','NEWWORD','Log','constructor']) {
    expect(recordingRequirement(word,entries),word).toBe('word');
  }
});

it('exempts phrases and explicitly reviewed abbreviations, names and transliterations',()=>{
  for (const word of ['from (then) on','look forward to','New York']) expect(recordingRequirement(word,entries)).toBe('phrase');
  for (const word of ['CE','GPS','cm','p.m.','PETS']) expect(recordingRequirement(word,entries)).toBe('abbreviation');
  for (const word of ['Buñol','Cusco','Reid','Jean-Philippe']) expect(recordingRequirement(word,entries)).toBe('proper-name');
  expect(recordingRequirement('chiwen',entries)).toBe('transliteration');
});

it('keeps every exemption tied to a current high-school headword and a known reason',()=>{
  const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
  const words=new Set(catalog.entries.filter((e:any)=>e.memberships.some((m:any)=>m.bookId.startsWith('pep2019-'))).map((e:any)=>e.headword));
  for (const [word,reason] of Object.entries(entries)) {
    expect(words.has(word),word).toBe(true);
    expect(['abbreviation','proper-name','transliteration']).toContain(reason);
  }
});
