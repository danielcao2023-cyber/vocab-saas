import { expect, it } from 'vitest';
import fs from 'node:fs';

it('provides documented local human recordings for representative later-unit words', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['fitness', 'stadium', 'gymnastics', 'legend', 'glory']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for representative optional book one terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['malaria', 'vital', 'academy', 'academic', 'objective']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for representative compulsory book three terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['costume', 'congratulate', 'ceremony', 'range', 'origin']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for representative compulsory book two terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['heritage', 'temple', 'former', 'preserve', 'promote']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for representative optional book two terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['cholera', 'severe', 'contradictory', 'germ', 'subscribe']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for representative optional book three terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['precisely', 'primitive', 'humanity', 'breakthrough', 'reputation']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for representative optional book four terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['fiction', 'ridiculous', 'integrity', 'dignity', 'salary']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for further optional-book terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['cruel', 'furniture', 'privilege', 'plug']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings recovered after rate limiting', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['bull', 'dawn', 'cage', 'collar']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});
