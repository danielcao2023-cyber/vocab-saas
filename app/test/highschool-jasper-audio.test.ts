import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canReusePronunciation } from '../server/src/pronunciation-import-state.ts';
import { packPronunciations } from '../scripts/mobile-pronunciation-assets.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'data/pronunciation');
const entry = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8')).entries.Jasper;

it('packs the attributed original-derived Jasper recording with verified offline bytes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'jasper-offline-'));
  try {
    expect(entry.author).toBe('Neskaya');
    expect(entry.licenseUrl).toBe('https://creativecommons.org/licenses/by-sa/3.0/');
    expect(entry.pronunciationNote).toContain('尚未人工试听');
    const packed = packPronunciations({ version: 1, entries: { Jasper: entry } }, source, directory);
    expect(createHash('sha256').update(readFileSync(join(directory, entry.file))).digest('hex')).toBe(entry.sha256);
    expect(packed.recordings.Jasper.file).toBe(`/offline/recordings/${entry.file}`);
    expect(packed.credits).toContain('Neskaya');
    expect(packed.credits).toContain(entry.licenseUrl);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

it('preserves only the verified Jasper recording on import restart and rejects forged metadata or bytes', () => {
  const temp = mkdtempSync(join(tmpdir(), 'jasper-import-'));
  try {
    copyFileSync(join(source, entry.file), join(temp, entry.file));
    expect(canReusePronunciation('Jasper', entry, temp)).toBe(true);
    for (const altered of [{author: 'someone else'}, {sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-us-jasper-fake.ogg'}, {license: 'CC0'}, {sha256: 'a'.repeat(64)}])
      expect(canReusePronunciation('Jasper', { ...entry, ...altered }, temp)).toBe(false);
    writeFileSync(join(temp, 'manifest.json'), JSON.stringify({ version: 1, entries: { Jasper: entry } }));
    const run = spawnSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/prepare-pronunciation.ts'), `--directory=${temp}`, `--audition-directory=${join(temp, 'audition')}`, '--seed-only', '--limit=0'], { cwd: root, encoding: 'utf8', timeout: 15_000 });
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(temp, 'manifest.json'), 'utf8')).entries.Jasper).toEqual(entry);
    writeFileSync(join(temp, entry.file), 'forged');
    expect(canReusePronunciation('Jasper', entry, temp)).toBe(false);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
