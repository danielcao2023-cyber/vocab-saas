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

it.each([['set an example','/ˌset ən ɪɡˈzɑːmpl/'],['in response to','/ɪn rɪˈspɒns tə/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['as a matter of fact','/əz ə ˌmætər əv ˈfækt/'],['take part in','/ˌteɪk ˈpɑːt ɪn/'],['lead to','/ˈliːd tə/']])('shows the sourced pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['come along','/ˌkʌm əˈlɒŋ/'],['in shock','/ɪn ˈʃɒk/'],['participate in','/pɑːˈtɪsəpeɪt ɪn/']])('shows the sourced British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['go through','/ˌɡəʊ ˈθruː/'],['get through','/ˌɡet ˈθruː/'],['go off','/ˌɡəʊ ˈɒf/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','primary']);
});

it.each([['even though','/ˌiːvən ˈðəʊ/'],['in tears','/ɪn ˈtɪəz/']])('shows the sourced British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['on average','/ɒn ˈævərɪdʒ/'],['take advantage of','/ˌteɪk ədˈvɑːntɪdʒ əv/']])('shows the Pearson British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['as well as','/əz ˈwel əz/'],['belong to','/bɪˈlɒŋ tə/'],['search for','/ˈsɜːtʃ fə/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['fall apart','/fɔːl əˈpɑːt/'],['apart from','/əˈpɑːt frəm/'],['result in','/rɪˈzʌlt ɪn/'],['for instance','/fər ˈɪnstəns/']])('shows the Oxford phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['adapt to','/əˈdæpt tə/'],['aware of','/əˈweər əv/'],['concerned about','/kənˈsɜːnd əbaʊt/']])('shows the sourced British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['now that','/ˈnaʊ ðət/'],['in despair','/ɪn dɪˈspeə/']])('shows the sourced British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it('shows the National Geographic Learning pronunciation for in spite of',()=>{
 const lesson=getSoundSpellingLesson('in spite of');
 expect(lesson?.ipa).toBe('/ɪn ˈspaɪt əv/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('in spite of');
});

it.each([['on hand','/ɒn ˈhænd/'],['keep track of','/kiːp ˈtræk əv/'],['pass away','/ˌpɑːs əˈweɪ/']])('shows the sourced British pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
});

it.each([['even if','/ˈiːvn ɪf/'],['make it','/ˈmeɪk ɪt/']])('shows the sourced phrase pronunciation for %s',(word,ipa)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(word === 'even if' ? ['primary','none','none'] : ['primary','none']);
});

it.each([
 ['relate to','/rɪˈleɪt tə/',['none','primary','none']],
 ['turn to','/ˈtɜːn tə/',['primary','none']],
 ['insist on','/ɪnˈsɪst ɒn/',['none','primary','none']],
 ['switch off','/ˌswɪtʃ ˈɒf/',['secondary','primary']],
 ['appeal to','/əˈpiːl tə/',['none','primary','none']],
])('matches the source pronunciation and stress for %s',(word,ipa,stress)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(stress);
});

it.each([
 ['tuition fees','/tjuˈɪʃn fiːz/',['none','primary','none','none']],
 ['in return','/ˌɪn rɪˈtɜːn/',['secondary','none','primary']],
])('matches the Oxford wordlist pronunciation and stress for %s',(word,ipa,stress)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(stress);
});

it('matches Cambridge Think pronunciation and stress for earn a living',()=>{
 const lesson=getSoundSpellingLesson('earn a living');
 expect(lesson?.ipa).toBe('/ˌɜːn ə ˈlɪv.ɪŋ/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('earn a living');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','none','primary','none']);
});

it.each([
 ['the media','/ðə ˈmiːdiə/',['none','primary','none']],
 ['on duty','/ɒn ˈdjuːti/',['none','primary','none']],
 ['by accident','/baɪ ˈæksɪdənt/',['none','primary','none','none']],
])('matches the Oxford Masterclass pronunciation and stress for %s',(word,ipa,stress)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(stress);
});

it('matches the Pearson Focus pronunciation and stress for fall in love with',()=>{
 const lesson=getSoundSpellingLesson('fall in love with');
 expect(lesson?.ipa).toBe('/ˌfɔːl ɪn ˈlʌv wɪð/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('fall in love with');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','none','primary','none']);
});

it.each([
 ['make an impression','/ˌmeɪk ən ɪmˈpreʃən/',['secondary','none','none','primary','none']],
 ['a great deal','/ə ˈɡreɪt diːl/',['none','primary','none']],
])('matches Pearson Focus pronunciation and stress for %s',(word,ipa,stress)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(stress);
});

it.each([
 ['on the move','/ɒn ðə ˈmuːv/',['none','none','primary']],
 ['in that case','/ɪn ˈðæt keɪs/',['none','primary','none']],
])('matches the textbook pronunciation and stress for %s',(word,ipa,stress)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(stress);
});

it.each([
 ['except for','/ɪkˈsept fə/',['none','primary','none']],
 ['in memory of','/ɪn ˈmeməri əv/',['none','primary','none','none','none']],
])('matches the wordlist pronunciation and stress for %s',(word,ipa,stress)=>{
 const lesson=getSoundSpellingLesson(word);
 expect(lesson?.ipa).toBe(ipa);
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe(word);
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(stress);
});

it('matches the Pearson Focus pronunciation and stress for volcanic eruption',()=>{
 const lesson=getSoundSpellingLesson('volcanic eruption');
 expect(lesson?.ipa).toBe('/vɒlˌkænɪk ɪˈrʌpʃən/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('volcanic eruption');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','secondary','none','none','primary','none']);
});

it('matches Macmillan Gateway Plus pronunciation and stress for on the basis of',()=>{
 const lesson=getSoundSpellingLesson('on the basis of');
 expect(lesson?.ipa).toBe('/ɒn ðə ˈbeɪsɪs əv/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('on the basis of');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','none','primary','none','none']);
});

it('matches Oxford first-hand pronunciation and stress for first hand',()=>{
 const lesson=getSoundSpellingLesson('first hand');
 expect(lesson?.ipa).toBe('/ˌfɜːst ˈhænd/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('first hand');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','primary']);
});

it('matches Business in Context pronunciation and stress for take out a loan',()=>{
 const lesson=getSoundSpellingLesson('take out a loan');
 expect(lesson?.ipa).toBe('/teɪk ˌaʊt ə ˈləʊn/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('take out a loan');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','secondary','none','primary']);
});

it('matches English in Context pronunciation and stress for daily routine',()=>{
 const lesson=getSoundSpellingLesson('daily routine');
 expect(lesson?.ipa).toBe('/ˌdeɪli ruːˈtiːn/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('daily routine');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['secondary','none','none','primary']);
});

it('matches English in Context pronunciation and stress for blog post',()=>{
 const lesson=getSoundSpellingLesson('blog post');
 expect(lesson?.ipa).toBe('/ˈblɒɡ pəʊst/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('blog post');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['primary','none']);
});

it('matches On Screen pronunciation and stress for fade away',()=>{
 const lesson=getSoundSpellingLesson('fade away');
 expect(lesson?.ipa).toBe('/feɪd əˈweɪ/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('fade away');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','none','primary']);
});

it('matches Burlington Mindset pronunciation and stress for a great deal of',()=>{
 const lesson=getSoundSpellingLesson('a great deal of');
 expect(lesson?.ipa).toBe('/ə ɡreɪt ˈdiːl ɒv/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('a great deal of');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['none','none','primary','none']);
});

it('matches Cambridge Think pronunciation and stress for so as to',()=>{
 const lesson=getSoundSpellingLesson('so as to');
 expect(lesson?.ipa).toBe('/ˈsəʊ əz tuː/');
 expect(lesson?.chunks.map(chunk=>chunk.letters).join('')).toBe('so as to');
 expect(lesson?.chunks.map(chunk=>chunk.stress)).toEqual(['primary','none','none']);
});
