import { expect, it } from 'vitest';
import fs from 'node:fs';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling/index';

it('provides lessons and sound-spelling guidance for the next Unit 2 words', () => {
  const words = ['arrangement', 'extremely', 'source', 'powerful', 'empire'];
  for (const [index, headword] of words.entries()) {
    expect(createLessonReader()({ id: 1691 + index, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});

it('provides reviewed travel and communication terms', () => {
  const words = ['credit card', 'detail', 'check in', 'check out', 'request', 'sight'];
  const read = createLessonReader();
  for (const [index, headword] of words.entries()) {
    expect(read({ id: 1721 + index, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});

it('provides the next travel and economics terms with reviewed content', () => {
  const words = [[1706, 'other than'], [1707, 'architecture'], [1708, 'architect'], [1718, 'economy'], [1719, 'economic'], [1720, 'credit']] as const;
  const read = createLessonReader();
  for (const [id, headword] of words) {
    expect(read({ id, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});

it('bundles verified human recordings for the newly sourced travel terms', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/pronunciation/manifest.json', import.meta.url), 'utf8'));
  for (const word of ['accommodation', 'civilisation', 'make up', 'transportation', 'credit card', 'check in', 'check out', 'BCE', 'unearth', 'Disneyland']) {
    const entry = manifest.entries[word];
    expect(entry?.author, word).toBeTruthy();
    expect(entry?.evidenceUrl, word).toMatch(/^https:\/\/en\.wiktionary\.org\/wiki\//);
    expect(fs.existsSync(new URL('../data/pronunciation/' + entry.file, import.meta.url)), word).toBe(true);
  }
});

it('provides the next travel and culture terms with reviewed content', () => {
  const words = ['brochure', 'package', 'package tour', 'contact', 'civilisation', 'civilization', 'make up', 'transport', 'transportation'];
  const read = createLessonReader();
  for (const [index, headword] of words.entries()) {
    expect(read({ id: 1709 + index, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});

it('provides reviewed Unit 2 lessons and spelling guidance for the travel vocabulary', () => {
  const words = ['site', 'take control of', 'official', 'recognize', 'type', 'flight', 'accommodation', 'unique', 'path', 'destination'];
  const read = createLessonReader();
  for (const [index, headword] of words.entries()) {
    expect(read({ id: 1696 + index, headword }).status, headword).toBe('ready');
    expect(getSoundSpellingLesson(headword), headword).toBeDefined();
  }
});
