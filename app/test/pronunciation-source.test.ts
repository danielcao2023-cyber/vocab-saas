import { describe, expect, it, vi } from 'vitest';
import { allowedAudioLicense, commonsIdentity, fetchCommonsRecordings, indexCommonsRecording, parseCommonsRecording,
  parseRetryAfter, resolvePronunciationSource, validAudioUrl, type CommonsRecording } from '../server/src/pronunciation-source.ts';

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
