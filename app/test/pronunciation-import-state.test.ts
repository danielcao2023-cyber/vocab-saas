import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { canReusePronunciation, type CachedPronunciation } from '../server/src/pronunciation-import-state.ts';
import { indexCommonsRecording } from '../server/src/pronunciation-source.ts';

const directories: string[] = [];
afterEach(() => { for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'pronunciation-cache-test-')); directories.push(directory);
  const bytes = Buffer.from('previously installed and decoded MP3 bytes');
  const entry: CachedPronunciation = { word: 'apple', file: 'apple.mp3', sha256: createHash('sha256').update(bytes).digest('hex'),
    accent: 'us', sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-us-apple.ogg', author: 'Recorder', license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0', audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ab/apple.ogg/apple.ogg.mp3', provider: 'wikimedia-commons' };
  writeFileSync(join(directory, entry.file), bytes);
  return { directory, entry };
}

describe('pronunciation importer cache reuse', () => {
  it('reuses intact files but retries empty, changed, and missing files', () => {
    const { directory, entry } = fixture();
    expect(canReusePronunciation('apple', entry, directory)).toBe(true);
    writeFileSync(join(directory, entry.file), Buffer.alloc(0));
    expect(canReusePronunciation('apple', entry, directory)).toBe(false);
    writeFileSync(join(directory, entry.file), 'changed bytes');
    expect(canReusePronunciation('apple', entry, directory)).toBe(false);
    rmSync(join(directory, entry.file));
    expect(canReusePronunciation('apple', entry, directory)).toBe(false);
  });

  it('replaces ready audio after the verified source selection changes', () => {
    const { directory, entry } = fixture();
    expect(canReusePronunciation('apple', entry, directory, { sourceUrl: entry.sourceUrl })).toBe(true);
    expect(canReusePronunciation('apple', entry, directory, { sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-uk-apple.ogg' })).toBe(false);
  });

  it('recognizes canonical filenames behind official redirects', () => {
    const { directory, entry } = fixture();
    const metadata = new Map();
    indexCommonsRecording(metadata, { title: 'File:En-us-apple.ogg', pageid: 1, sourceUrl: entry.sourceUrl,
      author: entry.author, license: entry.license, licenseUrl: entry.licenseUrl, description: 'US pronunciation', aliases: ['File:Old-apple.ogg'] });
    expect(canReusePronunciation('apple', entry, directory, { sourceUrl: 'https://commons.wikimedia.org/wiki/File:Old-apple.ogg' }, metadata)).toBe(true);
  });

  it('invalidates old ready phrases and aliases pointing to another word', () => {
    const { directory, entry } = fixture();
    for (const [word, title] of [['exam', 'En-uk-an exam.ogg'], ['apple', 'En-us-pear.ogg']]) {
      const sourceUrl = `https://commons.wikimedia.org/wiki/File:${title.replaceAll(' ', '_')}`;
      const requested = `https://commons.wikimedia.org/wiki/File:En-us-${word}.ogg`;
      const metadata = new Map();
      indexCommonsRecording(metadata, { title: `File:${title}`, pageid: 1, sourceUrl,
        author: entry.author, license: entry.license, licenseUrl: entry.licenseUrl, description: 'Pronunciation', aliases: [`File:En-us-${word}.ogg`] });
      expect(canReusePronunciation(word, { ...entry, word, sourceUrl }, directory, { sourceUrl: requested }, metadata)).toBe(false);
    }
  });

  it('requires explicit evidence to reuse a nonstandard recording', () => {
    const { directory, entry } = fixture();
    const sourceUrl = 'https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Speaker-apple.wav';
    const special = { ...entry, sourceUrl };
    expect(canReusePronunciation('apple', special, directory)).toBe(false);
    expect(canReusePronunciation('apple', special, directory, { sourceUrl, evidenceUrl: 'https://en.wiktionary.org/wiki/apple#English' })).toBe(true);
  });

  it('does not trust legacy assumed authors or unsafe cache paths', () => {
    const { directory, entry } = fixture();
    expect(canReusePronunciation('apple', { ...entry, author: 'Recorder assumed (based on copyright claims).' }, directory)).toBe(false);
    expect(canReusePronunciation('apple', { ...entry, file: '../apple.mp3' }, directory)).toBe(false);
  });

  it('the resume CLI retries a changed override instead of skipping its old ready entry', () => {
    const { directory, entry } = fixture();
    const sourceUrl = 'https://commons.wikimedia.org/wiki/File:En-uk-apple.ogg';
    writeFileSync(join(directory, 'manifest.json'), JSON.stringify({ version: 1, entries: { apple: entry } }));
    writeFileSync(join(directory, 'verified-overrides.json'), JSON.stringify({ version: 1, entries: { apple: { word: 'apple', sourceUrl, accent: 'uk' } } }));
    const bin = join(directory, 'bin'); mkdirSync(bin);
    // A fake transport proves the CLI attempts a retry without sending a real request.
    writeFileSync(join(bin, 'curl'), '#!/bin/sh\nexit 7\n', { mode: 0o755 });
    const app = fileURLToPath(new URL('../', import.meta.url));
    const run = spawnSync(process.execPath, ['--import', 'tsx', join(app, 'scripts/prepare-pronunciation.ts'),
      `--directory=${directory}`, `--audition-directory=${join(directory, 'audition')}`, '--words=apple', '--limit=1'], { cwd: app, encoding: 'utf8', timeout: 15_000,
      env: { ...process.env, PATH: bin + delimiter + process.env.PATH } });
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8')).entries.apple).toBeUndefined();
    expect(JSON.parse(readFileSync(join(directory, 'progress.json'), 'utf8')).words.apple)
      .toMatchObject({ status: 'unknown', sourceUrl });
    expect(run.stdout).toMatch(/metadata-unavailable|audio-network-unavailable/);
  });
});
