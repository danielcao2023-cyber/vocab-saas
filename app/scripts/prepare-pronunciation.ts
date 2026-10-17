/** Run from any directory: npx tsx scripts/prepare-pronunciation.ts --limit=20.
 * Offline seed: --seed-only. Explicit alternate service: --provider=free-dictionary.
 * 429/503 stops the batch and persists Retry-After; no automatic provider switching.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mainHeadwords } from '../server/src/text.ts';
import { canReusePronunciation } from '../server/src/pronunciation-import-state.ts';
import { PRONUNCIATION_DIRECTORY, PRONUNCIATION_USER_AGENT, COMMONS_METADATA_BATCH_LIMIT, commonsIdentity, fetchCommonsRecordings, indexCommonsRecording, loadCommonsMetadata, parseCommonsRecording, parseCommonsResponse,
  parseRetryAfter, resolvePronunciationSource, validAudioUrl, type PronunciationSource } from '../server/src/pronunciation-source.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const args = new Map(process.argv.slice(2).map(arg => { const i = arg.indexOf('='); return i < 0 ? [arg, 'true'] : [arg.slice(0, i), arg.slice(i + 1)]; }));
const directory = resolve(args.get('--directory') ?? PRONUNCIATION_DIRECTORY);
const provider = (args.get('--provider') ?? 'wikimedia-commons') as PronunciationSource['provider'];
if (provider !== 'wikimedia-commons' && provider !== 'free-dictionary') throw new Error('Unsupported --provider');
const limit = Number(args.get('--limit') ?? (args.has('--all') ? 1600 : 20));
const delay = Number(args.get('--delay-ms') ?? 2000);
const audioInterval = Number(args.get('--audio-interval-ms') ?? 2000);
const metadataBatchSize = Number(args.get('--metadata-batch-size') ?? COMMONS_METADATA_BATCH_LIMIT);
if (!Number.isInteger(limit) || limit < 0 || !Number.isFinite(delay) || delay < 1000) throw new Error('Use nonnegative integer --limit and --delay-ms>=1000');
if (!Number.isInteger(metadataBatchSize) || metadataBatchSize < 1 || metadataBatchSize > COMMONS_METADATA_BATCH_LIMIT) throw new Error('Use --metadata-batch-size between 1 and 50');
if (!Number.isFinite(audioInterval) || audioInterval < Math.max(2000, delay)) throw new Error('Use --audio-interval-ms>=max(2000,delay-ms)');
type Entry = PronunciationSource & { file: string; sha256: string };
type Manifest = { version: 1; entries: Record<string, Entry> };
type ProgressEntry = { status: 'ready' | 'unknown' | 'missing'; checkedAt: string; reason?: string; retryAt?: string; sourceUrl?: string };
type Progress = { version: 1; words: Record<string, ProgressEntry>; cooldowns: Record<string, string>; audioIntervalMs?: number };
const readJson = <T>(path: string, fallback: T): T => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
const writeJson = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n');
  renameSync(`${path}.tmp`, path);
};
mkdirSync(directory, { recursive: true });
const manifest = readJson<Manifest>(join(directory, 'manifest.json'), { version: 1, entries: {} });
const progress = readJson<Progress>(join(directory, 'progress.json'), { version: 1, words: {}, cooldowns: {} });
let effectiveAudioInterval = Math.max(audioInterval, progress.audioIntervalMs ?? 0);
const metadata = loadCommonsMetadata(directory);
const audition = resolve(args.get('--audition-directory') ?? join(root, '.tmp/pronunciation-audition'));
const rawMetadataDirectory = join(audition, 'metadata-responses');
if (existsSync(rawMetadataDirectory)) for (const file of readdirSync(rawMetadataDirectory).filter(file => file.endsWith('.json'))) {
  for (const record of parseCommonsResponse(readJson(join(rawMetadataDirectory, file), {}))) indexCommonsRecording(metadata, record);
}
const initialMetadata = readJson<any>(join(audition, 'commons-metadata.json'), {});
for (const page of initialMetadata.query?.pages ?? []) {
  const record = parseCommonsRecording(page);
  if (record && !metadata.has(`id:${record.pageid}`)) indexCommonsRecording(metadata, record);
}
const syllabus = readFileSync(join(root, 'data/curriculum/ocr/level3_list.tsv'), 'utf8').trim().split(/\r?\n/).slice(1)
  .map(line => mainHeadwords(line.split('\t')[1] ?? '')[0]).filter(Boolean);
const targets = [...new Set(syllabus)];
const selected = args.has('--words') ? args.get('--words')!.split(',') : targets;
if (selected.some(word => !targets.includes(word))) throw new Error('--words must contain exact curriculum main headwords');
const coverage = readJson<any>(join(audition, 'coverage.json'), {});
const baseHints = new Map<string, string>((coverage.entries ?? []).flatMap((entry: any) =>
  entry.match?.descriptionurl ? [[entry.headword, entry.match.descriptionurl]] : []));
const hints = new Map(baseHints);
let overrides: Record<string, any> = {};
function refreshOverrides() {
  overrides = readJson<any>(join(directory, 'verified-overrides.json'), { entries: {} }).entries;
  hints.clear(); for (const [word, sourceUrl] of baseHints) hints.set(word, sourceUrl);
  for (const [word, override] of Object.entries<any>(overrides)) {
    if (targets.includes(word) && override.word === word && commonsIdentity(override.sourceUrl ?? '')) hints.set(word, override.sourceUrl);
  }
  for (const [word, entry] of Object.entries(manifest.entries)) {
    if (!hasLocalAudio(word)) {
      delete manifest.entries[word];
      progress.words[word] = { status: 'unknown', checkedAt: new Date().toISOString(), reason: 'cache-needs-refresh', sourceUrl: hints.get(word) };
    } else if (overrides[word]) {
      // Evidence/notes can change without downloading identical verified bytes again.
      const override = overrides[word];
      delete entry.pronunciationNote; delete entry.matchedSense; delete entry.evidenceUrl;
      for (const key of ['accent', 'pronunciationNote', 'matchedSense', 'evidenceUrl'] as const)
        if (override[key] !== undefined) entry[key] = override[key];
    }
  }
}
refreshOverrides();

function verifyMp3(path: string): boolean {
  const stat = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name', '-show_entries', 'format=duration', '-of', 'json', path], { encoding: 'utf8' });
  if (stat.status !== 0) return false;
  try {
    const info = JSON.parse(stat.stdout);
    const duration = Number(info.format?.duration);
    return info.streams?.[0]?.codec_name === 'mp3' && duration > 0.1 && duration < 30;
  } catch { return false; }
}
function filename(word: string): string {
  return `${word.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${createHash('sha256').update(word).digest('hex').slice(0, 12)}.mp3`;
}
function save() {
  writeJson(join(directory, 'manifest.json'), manifest);
  writeJson(join(directory, 'progress.json'), progress);
  writeJson(join(directory, 'sources.json'), [...new Map([...metadata.values()].map(record => [record.pageid, record])).values()]);
  const ready = targets.filter(hasLocalAudio);
  const missing = targets.filter(word => !ready.includes(word) && progress.words[word]?.status === 'missing');
  const unknown = targets.filter(word => !ready.includes(word) && !missing.includes(word));
  writeJson(join(directory, 'coverage.json'), { version: 1, checkedAt: new Date().toISOString(), total: targets.length,
    ready: ready.length, missing: missing.length, unknown: unknown.length, readyWords: ready, missingWords: missing, unknownWords: unknown,
    note: 'Ready means locally cached, MP3-decodable human recording with file-level provenance. It does not mean a teacher has audited every pronunciation. Unknown includes unattempted words, network failures, unverified provenance, and unmatched filenames.' });
}
function install(word: string, source: PronunciationSource, bytes: Buffer): boolean {
  const file = filename(word);
  const temporary = join(directory, `${file}.part`);
  writeFileSync(temporary, bytes);
  if (!verifyMp3(temporary)) { rmSync(temporary, { force: true }); return false; }
  renameSync(temporary, join(directory, file));
  manifest.entries[word] = { ...source, file, sha256: createHash('sha256').update(bytes).digest('hex') };
  progress.words[word] = { status: 'ready', checkedAt: new Date().toISOString() };
  return true;
}

// The two local samples have already been auditioned. Copy only when provenance matches.
for (const word of ['receive', 'accept']) {
  if (manifest.entries[word]) continue;
  const path = join(audition, `${word}.mp3`);
  const record = metadata.get(`title:File:En-us-${word}.ogg`);
  if (existsSync(path) && record) install(word, { word, accent: 'us', sourceUrl: record.sourceUrl,
    author: record.author, license: record.license, licenseUrl: record.licenseUrl, provider: 'wikimedia-commons',
    audioUrl: (record.originalUrl ?? '').split('?')[0] }, readFileSync(path));
}
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
class AudioFailure extends Error {
  constructor(message: string, readonly retryAt?: string) { super(message); }
}
/** One HTTP/1.1 request to the exact supplied URL; redirects are never followed. */
function curlRequest(url: string, kind: 'audio' | 'metadata'): { status: number; headers: Headers; bytes: Buffer } {
  const temporary = join(directory, `.transport-${kind}`);
  const headerFile = `${temporary}.headers`;
  try {
    const result = spawnSync('curl', ['--http1.1', '--proto', '=https', '--silent', '--show-error', '--connect-timeout', '10', '--max-time', '30',
      '--max-filesize', '2000000', '--user-agent', PRONUNCIATION_USER_AGENT,
      '--header', `Accept: ${kind === 'metadata' ? 'application/json' : 'audio/*'}`,
      '--dump-header', headerFile, '--output', temporary, '--write-out', '%{http_code} %{time_connect} %{time_appconnect} %{time_starttransfer} %{time_total}', url], { encoding: 'utf8', timeout: 35_000 });
    const [status, connect, tls, firstByte, total] = result.stdout?.trim().split(/\s+/).map(Number) ?? [];
    mkdirSync(audition, { recursive: true });
    appendFileSync(join(audition, 'transport-timings.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind,
      host: new URL(url).hostname, status, connect, tls, firstByte, total, exitCode: result.status }) + '\n');
    const text = existsSync(headerFile) ? readFileSync(headerFile, 'utf8') : '';
    const last = text.trim().split(/\r?\n\r?\n/).at(-1) ?? '';
    const headers = new Headers();
    for (const line of last.split(/\r?\n/).slice(1)) {
      const colon = line.indexOf(':');
      if (colon > 0) headers.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
    }
    // Surface rate limits even if the server's response body timed out.
    if (status === 429 || status === 503) return { status, headers, bytes: Buffer.alloc(0) };
    if (result.status !== 0 || !status) throw new Error(`${kind}-network-unavailable`);
    return { status, headers, bytes: readFileSync(temporary) };
  } finally {
    rmSync(temporary, { force: true }); rmSync(headerFile, { force: true });
  }
}
const http1Fetch: typeof globalThis.fetch = async (input) => {
  const url = String(input);
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['commons.wikimedia.org', 'api.dictionaryapi.dev'].includes(parsed.hostname))
    throw new Error('untrusted-metadata-url');
  const { status, headers, bytes } = curlRequest(url, 'metadata');
  if (status === 200 && new URL(url).hostname === 'commons.wikimedia.org') {
    try {
      const data = JSON.parse(bytes.toString('utf8'));
      if (Array.isArray(data.query?.pages)) writeJson(join(audition, 'metadata-responses', `${createHash('sha256').update(url).digest('hex')}.json`), data);
    } catch { /* Keep invalid responses unknown; raw HTML is not cached as metadata. */ }
  }
  return new Response(new Uint8Array(bytes).buffer, { status, headers });
};
type AudioResult = { bytes: Buffer; error?: never } | { bytes?: never; error: AudioFailure };
let nextAudioRequestAt = 0;
/** Reuse one TLS connection for up to ten SERIAL transfers. Curl aborts at the first HTTP/network error. */
function downloadAudioGroup(sources: PronunciationSource[]): Map<string, AudioResult> {
  const output = new Map<string, AudioResult>();
  const command = ['--fail-early', '--rate', `${Math.max(1, Math.floor(60_000 / effectiveAudioInterval))}/m`];
  const paths = sources.map((_, index) => join(directory, `.transport-group-${index}`));
  for (const [index, source] of sources.entries()) {
    if (!validAudioUrl(source.audioUrl, source.provider)) throw new AudioFailure('invalid-audio-url');
    if (index) command.push('--next');
    command.push('--http1.1', '--proto', '=https', '--silent', '--show-error', '--fail-with-body', '--connect-timeout', '10', '--max-time', '30',
      '--max-filesize', '2000000', '--user-agent', PRONUNCIATION_USER_AGENT,
      '--header', 'Accept: audio/*', '--dump-header', `${paths[index]}.headers`, '--output', paths[index],
      '--write-out', `${index} %{http_code} %{exitcode} %{time_connect} %{time_appconnect} %{time_starttransfer} %{time_total} %{num_connects}\n`, source.audioUrl);
  }
  try {
    const processResult = spawnSync('curl', command, { encoding: 'utf8', timeout: sources.length * 40_000 });
    const lines = (processResult.stdout ?? '').trim().split(/\r?\n/).filter(Boolean);
    const lastDuration = Number(lines.at(-1)?.trim().split(/\s+/)[6]);
    // --rate applies within a curl process. Also preserve the start interval between groups.
    if (Number.isFinite(lastDuration)) nextAudioRequestAt = Date.now() - lastDuration * 1000 + effectiveAudioInterval;
    for (const line of lines) {
      const [index, status, exitCode, connect, tls, firstByte, total, connections] = line.trim().split(/\s+/).map(Number);
      const source = sources[index]; if (!source) continue;
      const headerText = existsSync(`${paths[index]}.headers`) ? readFileSync(`${paths[index]}.headers`, 'utf8') : '';
      const headers = headerText.trim().split(/\r?\n\r?\n/).at(-1) ?? '';
      appendFileSync(join(audition, 'transport-timings.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind: 'audio', mode: 'serial-reuse',
        host: new URL(source.audioUrl).hostname, status, exitCode, connect, tls, firstByte, total, connections }) + '\n');
      let error: AudioFailure | undefined;
      if (status === 429 || status === 503) {
        const retry = [...headers.matchAll(/^retry-after:\s*(.+)$/gim)].at(-1)?.[1]?.trim() ?? null;
        error = new AudioFailure('audio-rate-limited', new Date(parseRetryAfter(retry)).toISOString());
        progress.cooldowns[new URL(source.audioUrl).hostname] = error.retryAt!;
        progress.audioIntervalMs = effectiveAudioInterval = Math.min(60_000, Math.max(6000, effectiveAudioInterval * 2));
        save();
      } else if (exitCode !== 0) error = new AudioFailure('audio-network-unavailable');
      else if (status !== 200) error = new AudioFailure(`audio-http-${status}`);
      else if (!/^content-type:\s*audio\//im.test(headers)) error = new AudioFailure('not-audio');
      const bytes = !error && existsSync(paths[index]) ? readFileSync(paths[index]) : undefined;
      if (bytes && bytes.length > 2_000_000) error = new AudioFailure('audio-too-large');
      output.set(source.word, error ? { error } : bytes ? { bytes } : { error: new AudioFailure('audio-network-unavailable') });
    }
    if (!output.has(sources[0].word)) output.set(sources[0].word, { error: new AudioFailure('audio-network-unavailable') });
    return output;
  } finally {
    for (const path of paths) { rmSync(path, { force: true }); rmSync(`${path}.headers`, { force: true }); }
  }
}
const reviewReasons = new Set(['unsupported-headword', 'no-verified-commons-mp3', 'audio-provenance-unverified',
  'no-licensed-audio-in-response', 'dictionary-entry-not-found', 'invalid-mp3', 'not-audio', 'audio-http-404', 'whole-phrase-recording',
  'recording-headword-mismatch', 'unverified-recording-selection']);
if (args.has('--retry-unverified')) for (const [word, previous] of Object.entries(progress.words)) {
  if (previous.status !== 'ready' && reviewReasons.has(previous.reason ?? '')) delete progress.words[word];
}
function hasLocalAudio(word: string) {
  return canReusePronunciation(word, manifest.entries[word], directory, overrides[word], metadata);
}
function needsWork(word: string) {
  if (hasLocalAudio(word)) return false;
  const previous = progress.words[word];
  if (overrides[word] && previous?.sourceUrl !== hints.get(word)) return true;
  return !previous || !reviewReasons.has(previous.reason ?? '');
}
function due(word: string) {
  return needsWork(word) && (!(progress.words[word]?.retryAt && Date.parse(progress.words[word].retryAt!) > Date.now()) ||
    !!overrides[word] && progress.words[word]?.sourceUrl !== hints.get(word));
}
let attempted = 0;
async function runBatch() {
  refreshOverrides();
  const currentCooldown = Math.max(...Object.values(progress.cooldowns).map(value => Date.parse(value)), 0);
  if (currentCooldown > Date.now()) {
    console.log(JSON.stringify({ stopped: 'provider-cooldown', provider, retryAt: new Date(currentCooldown).toISOString() }));
    return;
  }
  let failures = 0;
  const lookedUp = new Set<string>();
  const downloaded = new Map<string, AudioResult>();
  const queue = selected.filter(due).sort((a, b) => {
    const rank = (word: string) => metadata.get(commonsIdentity(hints.get(word) ?? '')!)?.audioUrl ? 0 :
      overrides[word] && progress.words[word]?.sourceUrl !== hints.get(word) ? 1 : !progress.words[word] ? 2 : 3;
    return rank(a) - rank(b);
  }).slice(0, limit);
  for (let index = 0; index < queue.length; index++) {
    const word = queue[index];
    if (hasLocalAudio(word)) continue;
    if (provider === 'wikimedia-commons' && !metadata.get(commonsIdentity(hints.get(word) ?? '')!)?.audioUrl && !lookedUp.has(word)) {
      const batchWords = queue.slice(index).filter(w => hints.has(w) && !lookedUp.has(w) && !metadata.get(commonsIdentity(hints.get(w)!)!)?.audioUrl).slice(0, metadataBatchSize);
      if (batchWords.length) {
        const batch = await fetchCommonsRecordings(batchWords.map(w => hints.get(w)!), { metadata, fetch: http1Fetch, timeoutMs: 35_000 });
        if (batch.status === 'unknown') {
          for (const w of batchWords) progress.words[w] = { ...batch, sourceUrl: hints.get(w), checkedAt: new Date().toISOString(),
            retryAt: batch.retryAt ?? new Date(Date.now() + 300_000).toISOString() };
          if (batch.reason === 'rate-limited' && batch.retryAt) progress.cooldowns[provider] = batch.retryAt;
          save(); console.log(JSON.stringify({ stopped: 'metadata-unavailable', count: batchWords.length, ...batch })); return;
        }
        for (const w of batchWords) lookedUp.add(w);
        save(); await wait(delay);
      }
    }
    attempted++;
    const result = await resolvePronunciationSource(word, { provider, metadata, fetch: http1Fetch, sourceUrl: hints.get(word), timeoutMs: 35_000,
      ...(overrides[word] ? { accent: overrides[word].accent, pronunciationNote: overrides[word].pronunciationNote,
        matchedSense: overrides[word].matchedSense, evidenceUrl: overrides[word].evidenceUrl } : {}),
      ...(provider === 'wikimedia-commons' && hints.has(word) ? { lookupCommons: false } : {}) });
    const checkedAt = new Date().toISOString();
    if (result.status !== 'resolved') {
      progress.words[word] = { ...result, checkedAt, sourceUrl: hints.get(word),
        ...(result.status === 'unknown' && !reviewReasons.has(result.reason) ? { retryAt: result.retryAt ?? new Date(Date.now() + 300_000).toISOString() } : {}) };
      if (['network-unavailable', 'rate-limited', 'source-error', 'invalid-source-response'].includes(result.reason) || result.reason.startsWith('http-')) failures++;
      if (result.reason === 'rate-limited' && result.retryAt) progress.cooldowns[provider] = result.retryAt;
    } else {
      const audio = result.source.audioUrl;
      const host = new URL(audio).hostname;
      try {
        if (!validAudioUrl(audio, provider)) throw new AudioFailure('invalid-audio-url');
        if (!downloaded.has(word)) {
          const group = [result.source];
          // Only contiguous, already verified records may join. Resolving them cannot make network requests.
          if (provider === 'wikimedia-commons') for (const nextWord of queue.slice(index + 1, index + 10)) {
            if (hasLocalAudio(nextWord)) break;
            const next = await resolvePronunciationSource(nextWord, { provider, metadata, sourceUrl: hints.get(nextWord), lookupCommons: false,
              ...(overrides[nextWord] ? { accent: overrides[nextWord].accent, pronunciationNote: overrides[nextWord].pronunciationNote,
                matchedSense: overrides[nextWord].matchedSense, evidenceUrl: overrides[nextWord].evidenceUrl } : {}) });
            if (next.status !== 'resolved') break;
            group.push(next.source);
          }
          if (nextAudioRequestAt > Date.now()) await wait(nextAudioRequestAt - Date.now());
          for (const [key, value] of downloadAudioGroup(group)) downloaded.set(key, value);
        }
        const fetched = downloaded.get(word); downloaded.delete(word);
        if (!fetched || fetched.error) throw fetched?.error ?? new AudioFailure('audio-network-unavailable');
        const bytes = fetched.bytes;
        if (!install(word, result.source, bytes)) throw new AudioFailure('invalid-mp3');
        failures = 0;
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'audio-unavailable';
        const retryAt = error instanceof AudioFailure && error.retryAt ? error.retryAt : new Date(Date.now() + 300_000).toISOString();
        progress.words[word] = { status: 'unknown', checkedAt, reason, sourceUrl: hints.get(word),
          ...(!reviewReasons.has(reason) ? { retryAt } : {}) };
        failures++;
        if (reason === 'audio-rate-limited') progress.cooldowns[host] = retryAt;
      }
    }
    save(); console.log(JSON.stringify({ word, ...progress.words[word] }));
    if (['rate-limited', 'audio-rate-limited'].includes(progress.words[word]?.reason ?? '') || failures >= 3) return;
    // Downloaded results already obey curl's start interval; saving them needs no second throttle.
    if (progress.words[word]?.status !== 'ready') await wait(delay);
  }
}
save();
if (!args.has('--seed-only')) do {
  await runBatch();
  save();
  const report = readJson<any>(join(directory, 'coverage.json'), {});
  console.log(JSON.stringify({ attempted, total: report.total, ready: report.ready, unknown: report.unknown, missing: report.missing, directory }));
  if (!args.has('--all')) break;
  refreshOverrides();
  const pending = selected.filter(needsWork);
  if (!pending.length) { console.log(JSON.stringify({ stopped: 'remaining-words-need-source-review' })); break; }
  // Keep one serial queue, checking persisted provider cooldowns on every round.
  const cooldown = Math.max(...Object.values(progress.cooldowns).map(value => Date.parse(value)), 0);
  const nextWord = Math.min(...pending.map(word => Date.parse(progress.words[word]?.retryAt ?? '') || Date.now()));
  const until = Math.max(cooldown, nextWord, Date.now() + 30_000);
  console.log(JSON.stringify({ waitingUntil: new Date(until).toISOString(), pending: pending.length }));
  while (Date.now() < until) await wait(Math.min(30_000, until - Date.now()));
} while (true);
save();
