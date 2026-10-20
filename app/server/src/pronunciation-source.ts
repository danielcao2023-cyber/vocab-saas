import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type PronunciationAccent = 'us' | 'uk' | 'unknown';
export interface PronunciationSource {
  word: string;
  accent: PronunciationAccent;
  audioUrl: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  provider: 'wikimedia-commons' | 'free-dictionary';
  pronunciationNote?: string;
  matchedSense?: string;
  evidenceUrl?: string;
}
export interface CommonsRecording {
  title: string;
  pageid: number;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  description: string;
  originalUrl?: string;
  audioUrl?: string;
  aliases?: string[];
}
export type PronunciationResolution =
  | { status: 'resolved'; source: PronunciationSource }
  | { status: 'missing' | 'unknown'; reason: string; retryAt?: string };
export interface SourceOptions {
  provider?: 'wikimedia-commons' | 'free-dictionary';
  /** A previously matched Commons file; never a guessed media URL. */
  sourceUrl?: string;
  accent?: PronunciationAccent;
  pronunciationNote?: string;
  matchedSense?: string;
  evidenceUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  now?: () => number;
  metadata?: Map<string, CommonsRecording>;
  /** Disable additional Commons requests when evaluating the independent API. */
  lookupCommons?: boolean;
}

export const PRONUNCIATION_DIRECTORY = fileURLToPath(new URL('../../data/pronunciation/', import.meta.url));
export const COMMONS_METADATA_BATCH_LIMIT = 50;
const coolDowns = new Map<string, number>();
export const PRONUNCIATION_USER_AGENT = 'VocabSaasPronunciation/1.0 (https://github.com/danielcao2023-cyber; personal educational audio importer)';
const plain = (value: unknown): string => typeof value === 'string'
  ? value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()
  : '';

export function parseRetryAfter(value: string | null, now = Date.now()): number {
  if (value && /^\d+(?:\.\d+)?$/.test(value.trim())) return now + Math.max(1, Number(value)) * 1000;
  const date = value ? Date.parse(value) : NaN;
  return Number.isFinite(date) && date > now ? date : now + 60_000;
}

export function allowedAudioLicense(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol) && u.hostname === 'creativecommons.org' &&
      /^\/(?:licenses\/by(?:-sa)?\/(?:2\.0|2\.5|3\.0|4\.0)(?:\/us)?|publicdomain\/zero\/1\.0)(?:\/deed\.[a-zA-Z-]+)?\/?$/.test(u.pathname);
  } catch { return false; }
}
const normalizedLicense = (url: string) => url.replace(/^http:/, 'https:').replace(/\/deed\.[a-zA-Z-]+\/?$/, '').replace(/\/$/, '');
const normalizedFileTitle = (title: string) => title.replace(/_/g, ' ').replace(/^File:(.)/u, (_all, letter: string) => `File:${letter.toUpperCase()}`);

export function commonsIdentity(value: string): string | undefined {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 'commons.wikimedia.org') return;
    const id = u.searchParams.get('curid');
    if (u.pathname === '/w/index.php' && id && /^\d+$/.test(id)) return `id:${id}`;
    const title = u.pathname.startsWith('/wiki/') ? decodeURIComponent(u.pathname.slice(6)) : u.searchParams.get('title');
    if (title?.startsWith('File:') && !/[\r\n|]/.test(title)) return `title:${normalizedFileTitle(title)}`;
  } catch { /* Invalid/untrusted provider URL. */ }
}

export function indexCommonsRecording(map: Map<string, CommonsRecording>, record: CommonsRecording): void {
  map.set(`id:${record.pageid}`, record);
  map.set(`title:${normalizedFileTitle(record.title)}`, record);
  for (const alias of record.aliases ?? []) map.set(`title:${normalizedFileTitle(alias)}`, record);
}

export function loadCommonsMetadata(directory = PRONUNCIATION_DIRECTORY): Map<string, CommonsRecording> {
  const records = new Map<string, CommonsRecording>();
  try {
    const data: unknown = JSON.parse(readFileSync(`${directory}/sources.json`, 'utf8'));
    if (Array.isArray(data)) for (const record of data) {
      if (record && typeof record.title === 'string' && Number.isSafeInteger(record.pageid) &&
          typeof record.author === 'string' && record.author.trim() && !/no machine-readable author|assumed/i.test(record.author) && (allowedAudioLicense(record.licenseUrl) ||
            ['Public domain (PD-self)', 'Public domain (PD-user)'].includes(record.license) && commonsIdentity(record.sourceUrl) && record.licenseUrl === `${record.sourceUrl}#Licensing`)) indexCommonsRecording(records, record);
    }
  } catch { /* A fresh cache has no metadata yet. */ }
  return records;
}

/** Extract provenance from a Commons API response, not the API software's license. */
export function parseCommonsRecording(page: any): CommonsRecording | undefined {
  const info = page?.videoinfo?.[0] ?? page?.imageinfo?.[0];
  const m = info?.extmetadata;
  let author = plain(m?.Artist?.value);
  // Older files sometimes lack an Artist field but explicitly name the recorder in their description.
  if (!author || /no machine-readable author|assumed/i.test(author)) {
    const descriptionHtml = m?.ImageDescription?.value ?? '';
    const pronunciationBy = descriptionHtml.match(/pronunciation of([^\n]{0,200}?)\bby\s*(<a\b[^>]*>[^<]+<\/a>)/i);
    const namedPronouncer = pronunciationBy && !/\b(?:upload\w*|convert\w*|edit\w*|transfer\w*|modif\w*)\b/i.test(pronunciationBy[1])
      ? pronunciationBy[2] : undefined;
    author = plain(descriptionHtml.match(/recorded by\s*(<a\b[^>]*>[^<]+<\/a>)/i)?.[1] ??
      descriptionHtml.match(/(<a\b[^>]*>[^<]+<\/a>)(?:'|&#39;|&apos;)s pronunciation\b/i)?.[1] ??
      namedPronouncer);
  }
  let license = plain(m?.LicenseShortName?.value);
  let licenseUrl = m?.LicenseUrl?.value;
  const description = plain(m?.ImageDescription?.value);
  const pdTemplate = license === 'Public domain' && page?.categories?.find((category: any) => ['Category:PD-self', 'Category:PD-user'].includes(category.title))?.title?.slice(9);
  if (pdTemplate && commonsIdentity(info?.descriptionurl ?? '')) {
    license = `Public domain (${pdTemplate})`;
    licenseUrl = `${info.descriptionurl}#Licensing`;
  }
  if (!info || !author || /no machine-readable author|assumed/i.test(author) || !license || (!allowedAudioLicense(licenseUrl) && !pdTemplate) || !Number.isSafeInteger(page.pageid)) return;
  if (!commonsIdentity(info.descriptionurl ?? '') || typeof page.title !== 'string') return;
  if (/text[- ]to[- ]speech|speech synthesis|synthetic|AI[- ]generated|computer[- ]generated/i.test(`${description} ${author} ${page.title}`)) return;
  if (!/pronunciation|pronounced|recorded|speaker/i.test(description) && !/^File:(?:En-[a-z]+-|LL-)/i.test(page.title)) return;
  const mp3 = info.derivatives?.find((d: any) => d?.type === 'audio/mpeg' && validAudioUrl(d.src, 'wikimedia-commons'));
  return { title: page.title, pageid: page.pageid, sourceUrl: info.descriptionurl,
    author, license, licenseUrl: normalizedLicense(licenseUrl), description,
    ...(typeof info.url === 'string' ? { originalUrl: info.url } : {}), ...(mp3 ? { audioUrl: mp3.src } : {}) };
}

export function validAudioUrl(value: unknown, provider: PronunciationSource['provider']): value is string {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
    return provider === 'free-dictionary'
      ? u.hostname === 'api.dictionaryapi.dev' && /^\/media\/pronunciations\/en\/[^/]+\.mp3$/.test(u.pathname)
      : u.hostname === 'upload.wikimedia.org' && u.pathname.startsWith('/wikipedia/commons/') && u.pathname.endsWith('.mp3');
  } catch { return false; }
}

class SourceFailure extends Error {
  constructor(readonly reason: string, readonly retryAt?: string) { super(reason); }
}

async function jsonRequest(url: string, options: SourceOptions): Promise<any | null> {
  const now = options.now?.() ?? Date.now();
  const host = new URL(url).hostname;
  const until = coolDowns.get(host) ?? 0;
  if (until > now) throw new SourceFailure('rate-limited', new Date(until).toISOString());
  let response: Response;
  try {
    response = await (options.fetch ?? fetch)(url, { headers: { 'User-Agent': PRONUNCIATION_USER_AGENT, Accept: 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(options.timeoutMs ?? 12_000) });
  } catch { throw new SourceFailure('network-unavailable'); }
  if (response.status === 429 || response.status === 503) {
    const retry = parseRetryAfter(response.headers.get('retry-after'), now);
    coolDowns.set(host, retry);
    throw new SourceFailure('rate-limited', new Date(retry).toISOString());
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new SourceFailure(`http-${response.status}`);
  try { return await response.json(); } catch { throw new SourceFailure('invalid-source-response'); }
}

async function commonsRecord(sourceUrl: string, options: SourceOptions): Promise<CommonsRecording | undefined> {
  const identity = commonsIdentity(sourceUrl);
  if (!identity) return;
  const cached = options.metadata?.get(identity);
  if (cached && (options.provider === 'free-dictionary' || cached.audioUrl)) return cached;
  if (options.lookupCommons === false) return cached;
  const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', redirects: '1', prop: 'videoinfo|categories', clcategories: 'Category:PD-self|Category:PD-user', cllimit: '50',
    viprop: 'url|extmetadata|derivatives', viextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|ImageDescription', maxlag: '5',
    ...(identity.startsWith('id:') ? { pageids: identity.slice(3) } : { titles: identity.slice(6) }) });
  const result = await jsonRequest(`https://commons.wikimedia.org/w/api.php?${params}`, options);
  if (result?.error) throw new SourceFailure(`commons-${result.error.code ?? 'error'}`);
  const record = parseCommonsRecording(result?.query?.pages?.[0]);
  if (record) attachAliases([record], result?.query?.redirects ?? []);
  if (record && options.metadata) indexCommonsRecording(options.metadata, record);
  return record ?? cached;
}

/** Small metadata batches avoid one API query per word; no media are downloaded here. */
export async function fetchCommonsRecordings(sourceUrls: string[], options: SourceOptions = {}): Promise<
  { status: 'ready'; records: CommonsRecording[] } | { status: 'unknown'; reason: string; retryAt?: string }
> {
  if (!sourceUrls.length || sourceUrls.length > COMMONS_METADATA_BATCH_LIMIT) return { status: 'unknown', reason: 'invalid-batch-size' };
  const identities = sourceUrls.map(commonsIdentity);
  if (identities.some(id => !id?.startsWith('title:'))) return { status: 'unknown', reason: 'batch-requires-file-titles' };
  const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', redirects: '1', prop: 'videoinfo|categories', clcategories: 'Category:PD-self|Category:PD-user', cllimit: '50',
    viprop: 'url|extmetadata|derivatives', viextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|ImageDescription', maxlag: '5',
    titles: identities.map(id => id!.slice(6)).join('|') });
  try {
    const result = await jsonRequest(`https://commons.wikimedia.org/w/api.php?${params}`, options);
    if (result?.error) throw new SourceFailure(`commons-${result.error.code ?? 'error'}`);
    if (!Array.isArray(result?.query?.pages)) throw new SourceFailure('invalid-source-response');
    const records = parseCommonsResponse(result);
    if (options.metadata) for (const record of records) indexCommonsRecording(options.metadata, record);
    return { status: 'ready', records };
  } catch (error) {
    return error instanceof SourceFailure
      ? { status: 'unknown', reason: error.reason, ...(error.retryAt ? { retryAt: error.retryAt } : {}) }
      : { status: 'unknown', reason: 'source-error' };
  }
}

export function parseCommonsResponse(result: any): CommonsRecording[] {
  const records = (result?.query?.pages ?? []).map(parseCommonsRecording).filter((record: CommonsRecording | undefined): record is CommonsRecording => !!record);
  attachAliases(records, result?.query?.redirects ?? []);
  return records;
}

function attachAliases(records: CommonsRecording[], redirects: { from: string; to: string }[]): void {
  const map = new Map(records.map(record => [normalizedFileTitle(record.title), record]));
  // MediaWiki redirects remain on the same Commons repository; retain both names for later cache reads.
  for (let pass = 0; pass < redirects.length; pass++) for (const redirect of redirects) {
    const record = map.get(normalizedFileTitle(redirect.to));
    if (record) {
      record.aliases = [...new Set([...(record.aliases ?? []), redirect.from])];
      map.set(normalizedFileTitle(redirect.from), record);
    }
  }
}

function sourceFromRecord(word: string, record: CommonsRecording, options: SourceOptions): PronunciationSource | undefined {
  if (!record.audioUrl || !validAudioUrl(record.audioUrl, 'wikimedia-commons') || !record.author.trim() || /no machine-readable author|assumed/i.test(record.author)) return;
  const accent = options.accent ?? (/^File:En-us-/i.test(record.title) ? 'us' : /^File:En-uk-/i.test(record.title) ? 'uk' : 'unknown');
  return { word, accent, audioUrl: record.audioUrl, sourceUrl: record.sourceUrl, author: record.author,
    license: record.license, licenseUrl: record.licenseUrl, provider: 'wikimedia-commons',
    ...(options.pronunciationNote ? { pronunciationNote: options.pronunciationNote } : {}),
    ...(options.matchedSense ? { matchedSense: options.matchedSense } : {}),
    ...(options.evidenceUrl ? { evidenceUrl: options.evidenceUrl } : {}) };
}

function isWholePhraseRecording(word: string, title: string): boolean {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`-(?:a|an|the) ${escapedWord}\\.(?:ogg|oga|wav|mp3)$`, 'i').test(title.replace(/_/g, ' '));
}

/** Shared by resolution and cache reuse: an alias never proves what the actual file says. */
export function recordingWordProblem(word: string, title: string, options: Pick<SourceOptions, 'sourceUrl' | 'evidenceUrl'> = {}): string | undefined {
  const actual = normalizedFileTitle(title);
  if (isWholePhraseRecording(word, actual) || /-(?:a|an|the) [^/]+\.(?:ogg|oga|wav|mp3)$/i.test(actual)) return 'whole-phrase-recording';
  const ordinary = actual.match(/^File:En-(?:us|uk)-(.+)\.(?:ogg|oga|wav|mp3)$/i);
  if (ordinary?.[1].toLowerCase() === word.toLowerCase()) return;
  // Nonstandard filenames, spelling variants and sense-specific audio need an explicit,
  // independently checked Wiktionary mapping to this exact file (not a changed redirect target).
  const requested = commonsIdentity(options.sourceUrl ?? '');
  const stem = (value: string) => normalizedFileTitle(value).replace(/\.(?:ogg|oga|wav|mp3)$/i, '').toLowerCase();
  let evidence = false;
  try {
    const url = new URL(options.evidenceUrl ?? '');
    const normalWord = (value: string) => value.toLowerCase().replace(/[ .’'-]/g, '');
    const englishSection = url.hostname === 'en.wiktionary.org' || url.hostname === 'fr.wiktionary.org' && url.hash === '#Anglais';
    evidence = url.protocol === 'https:' && englishSection && url.pathname.startsWith('/wiki/') &&
      normalWord(decodeURIComponent(url.pathname.slice(6))) === normalWord(word);
  } catch { /* No verified mapping. */ }
  if (evidence && requested?.startsWith('title:') && stem(requested.slice(6)) === stem(actual)) return;
  return ordinary ? 'recording-headword-mismatch' : 'unverified-recording-selection';
}

/** Resolves only documented human recordings. Network failure is never evidence of missing audio. */
export async function resolvePronunciationSource(word: string, options: SourceOptions = {}): Promise<PronunciationResolution> {
  if (!word || word !== word.trim() || word.length > 100 || !/^[A-Za-z][A-Za-z .'’-]*$/.test(word))
    return { status: 'unknown', reason: 'unsupported-headword' };
  options = { ...options, provider: options.provider ?? 'free-dictionary', metadata: options.metadata ?? loadCommonsMetadata() };
  try {
    if (options.provider === 'wikimedia-commons') {
      const urls = options.sourceUrl ? [options.sourceUrl] : ['us', 'uk'].map(accent =>
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(`File:En-${accent}-${word}.ogg`)}`);
      for (const url of urls) {
        const title = commonsIdentity(url) ?? '';
        if (isWholePhraseRecording(word, title))
          return { status: 'unknown', reason: 'whole-phrase-recording' };
        const record = await commonsRecord(url, options);
        // A safe-looking requested filename may redirect to an article-plus-word recording.
        const problem = record && recordingWordProblem(word, record.title, { ...options, sourceUrl: url });
        if (problem) return { status: 'unknown', reason: problem };
        const source = record && sourceFromRecord(word, record, options);
        if (source) return { status: 'resolved', source };
      }
      return { status: 'unknown', reason: 'no-verified-commons-mp3' };
    }
    const entries = await jsonRequest(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, options);
    if (entries === null) return { status: 'missing', reason: 'dictionary-entry-not-found' };
    if (!Array.isArray(entries)) return { status: 'unknown', reason: 'invalid-source-response' };
    const candidates = entries.filter(e => typeof e?.word === 'string' && e.word.toLowerCase() === word.toLowerCase())
      .flatMap(e => Array.isArray(e.phonetics) ? e.phonetics : [])
      .filter(p => validAudioUrl(p?.audio, 'free-dictionary') && commonsIdentity(p?.sourceUrl ?? '') && allowedAudioLicense(p?.license?.url));
    candidates.sort((a, b) => Number(!/-us\.mp3$/.test(a.audio)) - Number(!/-us\.mp3$/.test(b.audio)));
    for (const p of candidates) {
      const record = await commonsRecord(p.sourceUrl, options);
      if (!record || !record.author.trim() || /no machine-readable author|assumed/i.test(record.author) || recordingWordProblem(word, record.title) || normalizedLicense(p.license.url) !== normalizedLicense(record.licenseUrl)) continue;
      const accent = /-us\.mp3$/.test(p.audio) ? 'us' : /-uk\.mp3$/.test(p.audio) ? 'uk' : 'unknown';
      return { status: 'resolved', source: { word, accent, audioUrl: p.audio, sourceUrl: record.sourceUrl,
        author: record.author, license: record.license, licenseUrl: record.licenseUrl, provider: 'free-dictionary' } };
    }
    return { status: 'unknown', reason: candidates.length ? 'audio-provenance-unverified' : 'no-licensed-audio-in-response' };
  } catch (error) {
    return error instanceof SourceFailure
      ? { status: 'unknown', reason: error.reason, ...(error.retryAt ? { retryAt: error.retryAt } : {}) }
      : { status: 'unknown', reason: 'source-error' };
  }
}
