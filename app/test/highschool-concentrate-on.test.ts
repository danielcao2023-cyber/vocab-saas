import {expect,it} from 'vitest';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';

it('shows the British pronunciation and full spelling for concentrate on',()=>{
 const lesson=getSoundSpellingLesson('concentrate on');
 expect(lesson?.ipa).toBe('/ˈkɒnsəntreɪt ɒn/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('concentrate on');
 expect(lesson?.chunks.at(-1)?.pairs.map(pair=>pair.sound).join('')).toBe('/ɒ//n/');
});

it('shows the Pearson British pronunciation and full spelling for at last',()=>{
 const lesson=getSoundSpellingLesson('at last');
 expect(lesson?.ipa).toBe('/ət ˈlɑːst/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('at last');
 expect(lesson?.chunks[1]?.stress).toBe('primary');
});

it('shows the Pearson British pronunciation and full spelling for trip over',()=>{
 const lesson=getSoundSpellingLesson('trip over');
 expect(lesson?.ipa).toBe('/trɪp ˈəʊvə/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('trip over');
 expect(lesson?.chunks[1]?.stress).toBe('primary');
});

it.each([['consist of','/kənˈsɪst əv/'],['due to','/ˈdjuː tuː/']])('shows the sourced phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it('shows the sourced British weak form and stress for look forward to',()=>{
 const lesson=getSoundSpellingLesson('look forward to');
 expect(lesson?.ipa).toBe('/ˌlʊk ˈfɔːwəd tə/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('look forward to');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','primary','none','none']);
});

it('shows the Collins phrasal-verb pronunciation for dress up',()=>{
 const lesson=getSoundSpellingLesson('dress up');
 expect(lesson?.ipa).toBe('/drɛs ˈʌp/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('dress up');
 expect(lesson?.chunks[1]?.stress).toBe('primary');
});

it.each([['make progress','/ˌmeɪk ˈprəʊɡres/'],['make a difference','/ˌmeɪk ə ˈdɪfərəns/']])('shows the Cambridge British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks[0]?.stress).toBe('secondary');
});

it('preserves the Oxford pronunciation and stress for cost an arm and a leg',()=>{
 const lesson=getSoundSpellingLesson('cost an arm and a leg');
 expect(lesson?.ipa).toBe('/ˌkɒst ən ˌɑːm ən ə ˈleɡ/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('cost an arm and a leg');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','none','secondary','none','none','primary']);
});

it.each([['work out','/ˌwɜːk ˈaʊt/'],['give up','/ˌɡɪv ˈʌp/']])('shows the sourced pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','primary']);
});

it.each([['take notes','/ˌteɪk ˈnəʊts/'],['make sense','/ˌmeɪk ˈsens/']])('shows the sourced pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','primary']);
});

it.each([['refer to','/rɪˈfɜː tə/'],['try out','/ˌtraɪ ˈaʊt/'],['make sure','/ˌmeɪk ˈʃʊə/'],['make fun of','/ˌmeɪk ˈfʌn əv/']])('shows the sourced British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it('shows the Cambridge pronunciation for ups and downs',()=>{
 const lesson=getSoundSpellingLesson('ups and downs');
 expect(lesson?.ipa).toBe('/ˌʌps ən ˈdaʊnz/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('ups and downs');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','none','primary']);
});

it.each([['rather than','/ˈrɑːðə ðən/'],['in ruins','/ɪn ˈruːɪnz/'],['under pressure','/ˌʌndə ˈpreʃə/']])('shows the sourced British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['die out','/ˌdaɪ ˈaʊt/'],['set off','/ˌset ˈɒf/'],['run out','/ˌrʌn ˈaʊt/'],['set out','/ˌset ˈaʊt/'],['break out','/ˌbreɪk ˈaʊt/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','primary']);
});

it.each([['on board','/ˌɒn ˈbɔːd/'],['speak up','/ˌspiːk ˈʌp/'],['turn out','/ˌtɜːn ˈaʊt/'],['after all','/ˌɑːftər ˈɔːl/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['to be honest','/tə bi ˈɒnɪst/'],['as a result','/əz ə rɪˈzʌlt/'],['keep in touch','/ˌkiːp ɪn ˈtʌtʃ/'],['out of shape','/ˌaʊt əv ˈʃeɪp/'],['pros and cons','/ˌprəʊz ənd ˈkɒns/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['in addition','/ˌɪn əˈdɪʃn/'],['in other words','/ɪn ˈʌðə wɜːdz/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});
