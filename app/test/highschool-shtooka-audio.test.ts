import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packPronunciations } from '../scripts/mobile-pronunciation-assets.ts';

it('packs independently attributed Shtooka recordings with intact offline bytes and credits', () => {
  const source = fileURLToPath(new URL('../data/pronunciation/', import.meta.url));
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
  const expected = [
    ['in the open air', 'Emmanuel Revah', 'https://creativecommons.org/licenses/by/2.0/fr/'],
    ['in memory of', 'Emmanuel Revah', 'https://creativecommons.org/licenses/by/2.0/fr/'],
    ['in ruins', 'Emmanuel Revah', 'https://creativecommons.org/licenses/by/2.0/fr/'],
    ['illustrate', 'Mary Maury', 'https://creativecommons.org/licenses/by/3.0/us/'],
    ['concrete', 'Mary Maury', 'https://creativecommons.org/licenses/by/3.0/us/'],
  ];
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shtooka-offline-'));
  try {
    const subset = { version: 1, entries: Object.fromEntries(expected.map(([word]) => [word, manifest.entries[word]])) };
    const packed = packPronunciations(subset, source, directory);
    for (const [word, author, license] of expected) {
      const entry = manifest.entries[word];
      expect(entry?.author).toContain(author);
      expect(entry.licenseUrl).toBe(license);
      expect(entry.sourceUrl).toMatch(/^https:\/\/fsi-languages\.yojik\.eu\/audiocollections\//);
      expect(entry.pronunciationNote).toContain('转码');
      const file = path.join(directory, entry.file);
      expect(createHash('sha256').update(fs.readFileSync(file)).digest('hex')).toBe(entry.sha256);
      expect(packed.recordings[word].file).toBe(`/offline/recordings/${entry.file}`);
      expect(packed.credits).toContain(author);
      expect(packed.credits).toContain(license);
      if (word === 'illustrate') expect(packed.credits).toContain('flac/eng-3277a641.flac');
      if (word === 'concrete') {
        expect(entry.pronunciationNote).toContain('尚未人工试听');
        expect(entry.pronunciationNote).toContain('重音可能与对照音标不同');
        expect(packed.recordings[word].pronunciationNote).toBe(entry.pronunciationNote);
      }
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
