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

it('provides documented recordings for further compulsory book three terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['frontier', 'vehicle', 'launch', 'orbit', 'giant']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for further compulsory book two terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['crowd', 'classical', 'soul', 'composition', 'opportunity']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented complete phrase recordings for Unit 3', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['injured', 'make sense', 'even though', 'push-up', 'now and then']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides a documented recording for Unit 4 length', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  const entry = manifest.entries.length;
  expect(entry?.author).toBeTruthy();
  expect(entry?.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
  expect(entry?.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\//);
  expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url))).toBe(true);
});

it('preserves explicit Commons public-domain provenance for reviewed recordings', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['injure', 'strength', 'destroy', 'brick']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.license, word).toBe('Public domain (PD-self)');
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(entry?.licenseUrl, word).toBe(entry?.sourceUrl + '#Licensing');
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('preserves PD-self and PD-user provenance for further high-school recordings', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const [word, license] of [['equal', 'Public domain (PD-self)'], ['dynamic', 'Public domain (PD-self)'], ['label', 'Public domain (PD-user)']] as const) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.license, word).toBe(license);
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(entry?.licenseUrl, word).toBe(entry?.sourceUrl + '#Licensing');
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides documented recordings for further optional book two terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['duration', 'quarry', 'idiom', 'anyhow', 'alongside']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.sourceUrl, word).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(entry?.licenseUrl, word).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});
