import { describe, expect, it, vi } from 'vitest';
import { allowedAudioLicense, commonsIdentity, fetchCommonsRecordings, indexCommonsRecording, parseCommonsRecording,
  parseRetryAfter, recordingWordProblem, resolvePronunciationSource, validAudioUrl, type CommonsRecording } from '../server/src/pronunciation-source.ts';

const record: CommonsRecording = { title: 'File:En-us-apple.ogg', pageid: 718877,
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-us-apple.ogg', author: 'Dvortygirl', license: 'CC BY-SA 3.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0', description: 'Pronunciation of the term in US English',
  audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9a/En-us-apple.ogg/En-us-apple.ogg.mp3' };
const phonetic = { audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/apple-us.mp3',
  sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=718877', license: { name: 'BY-SA 3.0', url: record.licenseUrl } };
const metadata = () => { const m = new Map<string, CommonsRecording>(); indexCommonsRecording(m, record); return m; };
const response = (body: unknown, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });
const fakeFetch = (body: unknown) => vi.fn<typeof globalThis.fetch>().mockResolvedValue(response(body));

describe('pronunciation provenance', () => {
  it('resolves an exact word only with its audio-level license and verified recording author', async () => {
    const fetch = fakeFetch([{ word: 'apple', phonetics: [phonetic] }]);
    const result = await resolvePronunciationSource('apple', { fetch, metadata: metadata(), lookupCommons: false });
    expect(result).toEqual({ status: 'resolved', source: { word: 'apple', accent: 'us', audioUrl: phonetic.audio,
      sourceUrl: record.sourceUrl, author: 'Dvortygirl', license: record.license, licenseUrl: record.licenseUrl, provider: 'free-dictionary' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not substitute an entry license for a missing audio license', async () => {
    const { license: _license, ...withoutLicense } = phonetic;
    const fetch = fakeFetch([{ word: 'apple', phonetics: [withoutLicense], license: { url: record.licenseUrl } }]);
    expect(await resolvePronunciationSource('apple', { fetch, metadata: metadata(), lookupCommons: false }))
      .toMatchObject({ status: 'unknown', reason: 'no-licensed-audio-in-response' });
  });

  it('keeps unknown when a recording author cannot be verified or licenses disagree', async () => {
    const fetch = fakeFetch([{ word: 'apple', phonetics: [phonetic] }]);
    expect(await resolvePronunciationSource('apple', { fetch, metadata: new Map(), lookupCommons: false }))
      .toMatchObject({ status: 'unknown', reason: 'audio-provenance-unverified' });
    const otherLicense = { ...phonetic, license: { url: 'https://creativecommons.org/licenses/by/4.0' } };
    expect(await resolvePronunciationSource('apple', { fetch: fakeFetch([{ word: 'apple', phonetics: [otherLicense] }]), metadata: metadata(), lookupCommons: false }))
      .toMatchObject({ status: 'unknown', reason: 'audio-provenance-unverified' });
  });

  it('does not accept a different response headword or arbitrary remote audio hosts', async () => {
    for (const data of [[{ word: 'apples', phonetics: [phonetic] }], [{ word: 'apple', phonetics: [{ ...phonetic, audio: 'https://untrusted.test/apple.mp3' }] }]]) {
      expect(await resolvePronunciationSource('apple', { fetch: fakeFetch(data), metadata: metadata(), lookupCommons: false }))
        .toMatchObject({ status: 'unknown' });
    }
    expect(validAudioUrl('https://api.dictionaryapi.dev.evil.test/media/pronunciations/en/apple-us.mp3', 'free-dictionary')).toBe(false);
    expect(commonsIdentity('https://commons.wikimedia.org.evil.test/wiki/File:En-us-apple.ogg')).toBeUndefined();
    expect(allowedAudioLicense('https://example.com/GPL-3.0')).toBe(false);
  });

  it('rejects an article-plus-word phrase before requesting or caching it', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    expect(await resolvePronunciationSource('butterfly', { provider: 'wikimedia-commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-uk-a_butterfly.ogg', fetch }))
      .toEqual({ status: 'unknown', reason: 'whole-phrase-recording' });
    expect(fetch).not.toHaveBeenCalled();
    expect(commonsIdentity('https://commons.wikimedia.org/wiki/File:en-us-a-stressed.ogg'))
      .toBe('title:File:En-us-a-stressed.ogg');
  });

  it('accepts an exact English recording when the article is part of the requested phrase', () => {
    expect(recordingWordProblem('a great deal', 'File:En-us-a_great_deal.ogg')).toBeUndefined();
    expect(recordingWordProblem('the Antarctic', 'File:En-uk-the Antarctic.ogg')).toBeUndefined();
  });

  it('still requires independent evidence for an exact nonstandard-accent filename', async () => {
    const phrase = { ...record, title: 'File:En-au-a great deal.ogg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-au-a_great_deal.ogg' };
    const map = new Map<string, CommonsRecording>(); indexCommonsRecording(map, phrase);
    const options = { provider: 'wikimedia-commons' as const, sourceUrl: phrase.sourceUrl, metadata: map, lookupCommons: false };
    expect(await resolvePronunciationSource('a great deal', options)).toMatchObject({ status: 'unknown', reason: 'unverified-recording-selection' });
    // Synthetic evidence exercises the selection guard; it is not a claim that this recording is on Wiktionary.
    expect(await resolvePronunciationSource('a great deal', { ...options, evidenceUrl: 'https://en.wiktionary.org/wiki/a%20great%20deal#English' }))
      .toMatchObject({ status: 'resolved', source: { word: 'a great deal' } });
  });

  it('rejects an extra article even when the requested phrase already begins with one', async () => {
    expect(recordingWordProblem('great deal', 'File:En-us-a great deal.ogg')).toBe('whole-phrase-recording');
    expect(recordingWordProblem('a great deal', 'File:En-us-the a great deal.ogg')).toBe('whole-phrase-recording');
    const phrase = { ...record, title: 'File:En-us-the a great deal.ogg', aliases: ['File:En-us-a great deal.ogg'] };
    const map = new Map<string, CommonsRecording>(); indexCommonsRecording(map, phrase);
    expect(await resolvePronunciationSource('a great deal', { provider: 'wikimedia-commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-us-a_great_deal.ogg', metadata: map, lookupCommons: false }))
      .toEqual({ status: 'unknown', reason: 'whole-phrase-recording' });
  });

  it('rejects a bare-word alias that redirects to an article-plus-word recording', async () => {
    const phrase = { ...record, title: 'File:En-uk-an exam.ogg', sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-uk-an_exam.ogg', aliases: ['File:En-uk-exam.ogg'] };
    const map = new Map<string, CommonsRecording>(); indexCommonsRecording(map, phrase);
    const fetchFn = vi.fn<typeof globalThis.fetch>();
    expect(await resolvePronunciationSource('exam', { provider: 'wikimedia-commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-uk-exam.ogg', metadata: map, lookupCommons: false, fetch: fetchFn }))
      .toEqual({ status: 'unknown', reason: 'whole-phrase-recording' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('does not resolve an ordinary alias that now points to a different headword', async () => {
    const other = { ...record, title: 'File:En-us-pear.ogg', sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-us-pear.ogg', aliases: [record.title] };
    const map = new Map<string, CommonsRecording>(); indexCommonsRecording(map, other);
    expect(await resolvePronunciationSource('apple', { provider: 'wikimedia-commons', sourceUrl: record.sourceUrl,
      metadata: map, lookupCommons: false, evidenceUrl: 'https://en.wiktionary.org/wiki/apple' }))
      .toEqual({ status: 'unknown', reason: 'recording-headword-mismatch' });
  });

  it('requires explicit word evidence for a nonstandard spelling or filename', async () => {
    const other = { ...record, title: 'File:En-us-center.ogg', sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-us-center.ogg' };
    const map = new Map<string, CommonsRecording>(); indexCommonsRecording(map, other);
    const options = { provider: 'wikimedia-commons' as const, sourceUrl: other.sourceUrl, metadata: map, lookupCommons: false };
    expect(await resolvePronunciationSource('centre', options)).toMatchObject({ status: 'unknown' });
    expect(await resolvePronunciationSource('centre', { ...options, evidenceUrl: 'https://en.wiktionary.org/wiki/centre#English' }))
      .toMatchObject({ status: 'resolved', source: { word: 'centre' } });
  });

  it('accepts a verified French Wiktionary English section but not its French section', async () => {
    const other = { ...record, title: 'File:LL-Q1860 (eng)-Grendelkhan-exam.wav', sourceUrl: 'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Grendelkhan-exam.wav' };
    const map = new Map<string, CommonsRecording>(); indexCommonsRecording(map, other);
    const options = { provider: 'wikimedia-commons' as const, sourceUrl: other.sourceUrl, metadata: map, lookupCommons: false };
    expect(await resolvePronunciationSource('exam', { ...options, evidenceUrl: 'https://fr.wiktionary.org/wiki/exam#Anglais' })).toMatchObject({ status: 'resolved' });
    expect(await resolvePronunciationSource('exam', { ...options, evidenceUrl: 'https://fr.wiktionary.org/wiki/exam#Français' })).toMatchObject({ status: 'unknown' });
  });

  it('distinguishes network errors from a real dictionary 404', async () => {
    expect(await resolvePronunciationSource('apple', { fetch: vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error('offline')) }))
      .toEqual({ status: 'unknown', reason: 'network-unavailable' });
    expect(await resolvePronunciationSource('apple', { fetch: vi.fn<typeof globalThis.fetch>().mockResolvedValue(response({}, 404)) }))
      .toEqual({ status: 'missing', reason: 'dictionary-entry-not-found' });
  });

  it('uses already verified Commons MP3 metadata without another network request', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    expect(await resolvePronunciationSource('apple', { provider: 'wikimedia-commons', metadata: metadata(), fetch }))
      .toMatchObject({ status: 'resolved', source: { provider: 'wikimedia-commons', audioUrl: record.audioUrl } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('parses per-file provenance and rejects explicitly synthetic recordings', () => {
    const page = { pageid: 718877, title: record.title, videoinfo: [{ descriptionurl: record.sourceUrl,
      extmetadata: { Artist: { value: '<a>Dvortygirl</a>' }, LicenseShortName: { value: record.license }, LicenseUrl: { value: record.licenseUrl }, ImageDescription: { value: record.description } },
      derivatives: [{ src: record.audioUrl, type: 'audio/mpeg' }] }] };
    expect(parseCommonsRecording(page)).toMatchObject(record);
    page.videoinfo[0].extmetadata.ImageDescription.value = 'AI-generated text-to-speech pronunciation';
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('rejects a Commons filename whose explicit spoken-word description contradicts it', () => {
    const page = { pageid: 1, title: 'File:En-us-temper.ogg', videoinfo: [{
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:En-us-temper.ogg',
      extmetadata: { Artist: { value: 'Example speaker' }, LicenseShortName: { value: 'CC BY-SA 3.0' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0' },
        ImageDescription: { value: "Pronunciation of the word 'associate' (noun/adjective)" } },
      derivatives: [{ src: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/En-us-temper.mp3', type: 'audio/mpeg' }],
    }] };
    expect(parseCommonsRecording(page)).toBeUndefined();
    page.videoinfo[0].extmetadata.ImageDescription.value = "Audio pronunciation of the term 'associate'";
    expect(parseCommonsRecording(page)).toBeUndefined();
    page.videoinfo[0].extmetadata.ImageDescription.value = 'Pronunciation of the word associate.';
    expect(parseCommonsRecording(page)).toBeUndefined();
    page.videoinfo[0].extmetadata.ImageDescription.value = 'Pronunciation of the term associate in US English';
    expect(parseCommonsRecording(page)).toBeUndefined();
    page.videoinfo[0].extmetadata.ImageDescription.value = 'Pronunciation of the term in US English';
    expect(parseCommonsRecording(page)).toMatchObject({ title: page.title });
    page.videoinfo[0].extmetadata.ImageDescription.value = "Pronunciation of the word 'temper'";
    expect(parseCommonsRecording(page)).toMatchObject({ title: page.title });
    page.title = "File:En-us-re-sign.ogg";
    page.videoinfo[0].extmetadata.ImageDescription.value = "Pronunciation of the word 'resign'";
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('matches explicit part-of-speech filename suffixes only when the description agrees', () => {
    const page = { pageid: 42, title: 'File:En-us-permit-noun.ogg', videoinfo: [{
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:En-us-permit-noun.ogg',
      extmetadata: { Artist:{value:'Dvortygirl'}, LicenseShortName:{value:'CC BY-SA 3.0'}, LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/3.0'}, ImageDescription:{value:"Pronunciation of the word 'permit' (noun) in US English"} },
      derivatives:[{src:'https://upload.wikimedia.org/wikipedia/commons/a/a1/permit.mp3',type:'audio/mpeg'}],
    }] };
    expect(parseCommonsRecording(page)).toMatchObject({title:page.title});
    page.videoinfo[0].extmetadata.ImageDescription.value = "Pronunciation of the word 'permit' (verb) in US English";
    expect(parseCommonsRecording(page)).toBeUndefined();
    page.videoinfo[0].extmetadata.ImageDescription.value = "Pronunciation of the word 'permissive' (noun) in US English";
    expect(parseCommonsRecording(page)).toBeUndefined();
    page.title = 'File:En-us-appropriate-adj.ogg';
    page.videoinfo[0].extmetadata.ImageDescription.value = "Pronunciation of the word 'appropriate' (adjective) in US English";
    expect(parseCommonsRecording(page)).toMatchObject({title:page.title});
    page.videoinfo[0].extmetadata.ImageDescription.value = "Pronunciation of the word 'appropriate' (verb) in US English";
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('accepts a numbered recording only when the described word matches the filename stem', () => {
    const page = { pageid: 42, title: 'File:En-us-emotion 2.ogg', categories: [{title:'Category:PD-self'}], videoinfo: [{
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:En-us-emotion_2.ogg',
      extmetadata: { Artist:{value:'Dvortygirl'}, LicenseShortName:{value:'Public domain'}, ImageDescription:{value:"Pronunciation of the word 'emotion' in US English"} },
      derivatives:[{src:'https://upload.wikimedia.org/wikipedia/commons/a/a1/emotion.mp3',type:'audio/mpeg'}],
    }] };
    expect(parseCommonsRecording(page)).toMatchObject({title:page.title});
    page.title = 'File:En-us-emotion-2.ogg';
    expect(parseCommonsRecording(page)).toMatchObject({title:page.title});
    page.videoinfo[0].extmetadata.ImageDescription.value = "Pronunciation of the word 'motion' in US English";
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('requires exact independent evidence for a numbered recording', async () => {
    const numbered: CommonsRecording = {...record, title:'File:En-us-emotion 2.ogg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:En-us-emotion_2.ogg', description:"Pronunciation of the word 'emotion' in US English"};
    const cached = new Map<string, CommonsRecording>(); indexCommonsRecording(cached, numbered);
    const options = {provider:'wikimedia-commons' as const, metadata:cached, sourceUrl:numbered.sourceUrl};
    expect(await resolvePronunciationSource('emotion', options)).toMatchObject({status:'unknown'});
    expect(await resolvePronunciationSource('emotion', {...options,evidenceUrl:'https://en.wiktionary.org/wiki/emotion#English'})).toMatchObject({status:'resolved',source:{word:'emotion'}});
    const conflict = new Map<string, CommonsRecording>(); indexCommonsRecording(conflict, {...numbered,description:"Pronunciation of the word 'motion'"});
    expect(await resolvePronunciationSource('emotion', {...options,metadata:conflict,evidenceUrl:'https://en.wiktionary.org/wiki/emotion#English'})).toMatchObject({status:'unknown'});
  });

  it('does not reuse cached metadata that explicitly describes another word', async () => {
    const conflicting = { ...record, description: "Pronunciation of the word 'associate'" };
    const cached = new Map();
    indexCommonsRecording(cached, conflicting);
    expect(await resolvePronunciationSource('apple', { provider: 'wikimedia-commons', metadata: cached,
      fetch: vi.fn<typeof globalThis.fetch>().mockResolvedValue(response({ query: { pages: [] } })) }))
      .toMatchObject({ status: 'unknown' });
  });

  it('rejects conflicting cached Commons metadata in the dictionary audio path', async () => {
    const cached = new Map<string, CommonsRecording>();
    indexCommonsRecording(cached, { ...record, description: "Pronunciation of the term 'associate'" });
    expect(await resolvePronunciationSource('apple', { fetch: fakeFetch([{ word: 'apple', phonetics: [phonetic] }]),
      metadata: cached, lookupCommons: false })).toMatchObject({ status: 'unknown' });
  });

  it('accepts an explicit PD-self file without pretending it has a CC0 license', () => {
    const page = { pageid: 42, title: 'File:En-us-afford.ogg', categories: [{ title: 'Category:PD-self' }], videoinfo: [{
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:En-us-afford.ogg',
      extmetadata: { Artist: { value: 'Dvortygirl' }, LicenseShortName: { value: 'Public domain' },
        ImageDescription: { value: 'Pronunciation of afford recorded by Dvortygirl' } },
    }] };
    expect(parseCommonsRecording(page)).toMatchObject({ author: 'Dvortygirl', license: 'Public domain (PD-self)',
      licenseUrl: 'https://commons.wikimedia.org/wiki/File:En-us-afford.ogg#Licensing' });
    page.categories = [];
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('preserves an explicit PD-user release instead of relabeling it as CC0', () => {
    const sourceUrl = 'https://commons.wikimedia.org/wiki/File:En-us-volleyball.ogg';
    const page = { pageid: 43, title: 'File:En-us-volleyball.ogg', categories: [{ title: 'Category:PD-user' }], videoinfo: [{
      descriptionurl: sourceUrl, extmetadata: { Artist: { value: 'Spacecat2' }, LicenseShortName: { value: 'Public domain' },
        ImageDescription: { value: 'Pronunciation of volleyball, American English male speaker' } } }] };
    expect(parseCommonsRecording(page)).toMatchObject({ author: 'Spacecat2', license: 'Public domain (PD-user)', licenseUrl: `${sourceUrl}#Licensing` });
    page.categories = [];
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('recognizes official CC deed URLs and explicit recorder attribution on older files', () => {
    const page = { pageid: 42, title: 'File:En-us-budget.ogg', videoinfo: [{
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:En-us-budget.ogg',
      extmetadata: { Artist: { value: 'No machine-readable author provided. Someone assumed.' },
        LicenseShortName: { value: 'CC BY-SA 3.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0/deed.en' },
        ImageDescription: { value: 'Pronunciation in US English, recorded by <a href="//commons.wikimedia.org/wiki/User:Neoglitch">Neoglitch</a>, 2011' } },
    }] };
    expect(parseCommonsRecording(page)).toMatchObject({ author: 'Neoglitch', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0' });
    expect(allowedAudioLicense('http://creativecommons.org/publicdomain/zero/1.0/deed.en')).toBe(true);
    page.videoinfo[0].extmetadata.ImageDescription.value = 'A pronunciation file with no named recorder.';
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('accepts the official fifty-title batch limit and refuses larger batches', async () => {
    const urls = Array.from({ length: 50 }, (_, i) => `https://commons.wikimedia.org/wiki/File:En-us-word${i}.ogg`);
    const fetchFn = fakeFetch({ query: { pages: [] } });
    expect(await fetchCommonsRecordings(urls, { fetch: fetchFn })).toEqual({ status: 'ready', records: [] });
    expect(new URL(String(fetchFn.mock.calls[0][0])).searchParams.get('titles')?.split('|')).toHaveLength(50);
    expect(await fetchCommonsRecordings([...urls, record.sourceUrl], { fetch: fetchFn }))
      .toEqual({ status: 'unknown', reason: 'invalid-batch-size' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('recognizes explicit possessive recorder attribution without trusting an assumed uploader', () => {
    const page = { pageid: 42, title: 'File:En-us-Chinese.ogg', categories: [{ title: 'Category:PD-self' }], videoinfo: [{
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:En-us-Chinese.ogg',
      extmetadata: { Artist: { value: 'No machine-readable author provided. Muke assumed.' },
        LicenseShortName: { value: 'Public domain' },
        ImageDescription: { value: '<a href="/wiki/User:Muke">Muke Tever</a>\'s pronunciation of Chinese in general American English.' } },
    }] };
    expect(parseCommonsRecording(page)).toMatchObject({ author: 'Muke Tever', license: 'Public domain (PD-self)' });
    page.videoinfo[0].extmetadata.ImageDescription.value = 'Pronunciation of the word <b>Chinese</b> by <a>Muke Tever</a>';
    expect(parseCommonsRecording(page)).toMatchObject({ author: 'Muke Tever' });
    page.videoinfo[0].extmetadata.ImageDescription.value = 'Pronunciation uploaded by <a>Someone</a>';
    expect(parseCommonsRecording(page)).toBeUndefined();
    page.videoinfo[0].extmetadata.ImageDescription.value = 'Pronunciation of the word Chinese uploaded by <a>Someone</a>';
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('recognizes a named human stressed-form recording described as pronounced', () => {
    const title = 'File:En-US should (stressed).ogg';
    const page = { pageid: 45, title, videoinfo: [{ descriptionurl: `https://commons.wikimedia.org/wiki/${title}`,
      extmetadata: { Artist: { value: 'Daviddwd' }, LicenseShortName: { value: 'CC BY-SA 4.0' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' },
        ImageDescription: { value: '"should" pronounced with stress in General American English' } } }] };
    expect(parseCommonsRecording(page)).toMatchObject({ author: 'Daviddwd' });
    page.videoinfo[0].extmetadata.ImageDescription.value = '"should" pronounced by synthetic text-to-speech';
    expect(parseCommonsRecording(page)).toBeUndefined();
  });

  it('preserves verified accent and sense evidence for alternate filenames', async () => {
    const other = { ...record, title: 'File:LL-Q1860 (eng)-Speaker-live.wav', pageid: 1,
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Speaker-live.wav' };
    const map = new Map<string, CommonsRecording>(); indexCommonsRecording(map, other);
    const result = await resolvePronunciationSource('live', { provider: 'wikimedia-commons', sourceUrl: other.sourceUrl,
      metadata: map, lookupCommons: false, accent: 'us', matchedSense: 'verb', pronunciationNote: '/lɪv/', evidenceUrl: 'https://en.wiktionary.org/wiki/live' });
    expect(result).toMatchObject({ status: 'resolved', source: { accent: 'us', matchedSense: 'verb', pronunciationNote: '/lɪv/' } });
  });

  it('preserves unknown on a failed Commons batch instead of claiming absent words', async () => {
    expect(await fetchCommonsRecordings([record.sourceUrl], { fetch: fakeFetch({ error: { code: 'maxlag' } }) }))
      .toEqual({ status: 'unknown', reason: 'commons-maxlag' });
  });

  it('retains Commons file redirects so verified renamed audio can be resolved offline', async () => {
    const oldTitle = 'File:LL-Q1860 (eng)-Speaker-apple.wav';
    const map = new Map<string, CommonsRecording>();
    const fetchFn = fakeFetch({ query: { redirects: [{ from: oldTitle, to: record.title }], pages: [{
      pageid: record.pageid, title: record.title, videoinfo: [{ descriptionurl: record.sourceUrl,
        extmetadata: { Artist: { value: record.author }, LicenseShortName: { value: record.license },
          LicenseUrl: { value: record.licenseUrl }, ImageDescription: { value: record.description } },
        derivatives: [{ src: record.audioUrl, type: 'audio/mpeg' }] }],
    }] } });
    const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(oldTitle)}`;
    expect(await fetchCommonsRecordings([sourceUrl], { fetch: fetchFn, metadata: map }))
      .toMatchObject({ status: 'ready', records: [{ aliases: [oldTitle] }] });
    expect(new URL(String(fetchFn.mock.calls[0][0])).searchParams.get('redirects')).toBe('1');
    expect(await resolvePronunciationSource('apple', { provider: 'wikimedia-commons', sourceUrl,
      metadata: map, lookupCommons: false, fetch: fetchFn })).toMatchObject({ status: 'resolved' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('pronunciation rate limits', () => {
  it('parses both Retry-After formats and cools the provider across different words', async () => {
    const now = Date.parse('2030-01-01T00:00:00Z');
    expect(parseRetryAfter('120', now)).toBe(now + 120_000);
    expect(parseRetryAfter('Tue, 01 Jan 2030 00:03:00 GMT', now)).toBe(now + 180_000);
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response({}, 429, { 'Retry-After': '120' }));
    const first = await resolvePronunciationSource('apple', { fetch, now: () => now });
    expect(first).toEqual({ status: 'unknown', reason: 'rate-limited', retryAt: '2030-01-01T00:02:00.000Z' });
    const second = await resolvePronunciationSource('about', { fetch, now: () => now + 1000 });
    expect(second).toEqual(first);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
