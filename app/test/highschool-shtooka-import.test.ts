import { expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canReuseShtookaRecording } from '../server/src/pronunciation-import-state.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'data/pronunciation');
const words = ['in the open air', 'in memory of', 'in ruins', 'illustrate'];
const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));

it('reuses only the four specifically reviewed Shtooka records and unchanged bytes', () => {
  const entry = manifest.entries['in memory of'];
  expect(canReuseShtookaRecording('in memory of', entry, source)).toBe(true);
  for (const altered of [
    { sourceUrl: 'https://evil.test/eng-4ee9dfc2.flac' },
    { licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
    { author: 'someone else' },
    { sha256: 'a'.repeat(64) },
    { provider: 'wikimedia-commons' },
  ]) expect(canReuseShtookaRecording('in memory of', { ...entry, ...altered }, source)).toBe(false);
  expect(canReuseShtookaRecording('unreviewed phrase', { ...entry, word: 'unreviewed phrase' }, source)).toBe(false);
  const temp = mkdtempSync(join(tmpdir(), 'shtooka-corrupt-'));
  try {
    writeFileSync(join(temp, entry.file), 'different bytes');
    expect(canReuseShtookaRecording('in memory of', entry, temp)).toBe(false);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

it('keeps the verified four entries on a fresh importer seed and rejects a forged source', () => {
  const temp = mkdtempSync(join(tmpdir(), 'shtooka-resume-'));
  try {
    const entries = Object.fromEntries(words.map(word => [word, manifest.entries[word]]));
    for (const entry of Object.values<any>(entries)) copyFileSync(join(source, entry.file), join(temp, entry.file));
    entries['in ruins'] = { ...entries['in ruins'], sourceUrl: 'https://evil.test/forged.flac' };
    writeFileSync(join(temp, 'manifest.json'), JSON.stringify({ version: 1, entries }));
    const run = spawnSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/prepare-pronunciation.ts'),
      `--directory=${temp}`, `--audition-directory=${join(temp, 'audition')}`, '--seed-only', '--limit=0'],
      { cwd: root, encoding: 'utf8', timeout: 15_000 });
    expect(run.status, run.stderr).toBe(0);
    const after = JSON.parse(readFileSync(join(temp, 'manifest.json'), 'utf8')).entries;
    for (const word of words.filter(word => word !== 'in ruins')) expect(after[word]).toEqual(entries[word]);
    expect(after['in ruins']).toBeUndefined();
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

it('preserves all four verified entries on importer restart', () => {
  const temp = mkdtempSync(join(tmpdir(), 'shtooka-resume-'));
  try {
    const entries = Object.fromEntries(words.map(word => [word, manifest.entries[word]]));
    for (const entry of Object.values<any>(entries)) copyFileSync(join(source, entry.file), join(temp, entry.file));
    writeFileSync(join(temp, 'manifest.json'), JSON.stringify({ version: 1, entries }));
    const run = spawnSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/prepare-pronunciation.ts'),
      `--directory=${temp}`, `--audition-directory=${join(temp, 'audition')}`, '--seed-only', '--limit=0'],
      { cwd: root, encoding: 'utf8', timeout: 15_000 });
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(temp, 'manifest.json'), 'utf8')).entries).toEqual(entries);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
