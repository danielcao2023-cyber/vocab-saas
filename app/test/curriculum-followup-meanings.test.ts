import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { openDb } from '../server/src/db.ts';
import { readCurriculum, readManualMeanings, upsertCurriculum } from '../server/src/import.ts';
import { applyWordPatches } from '../server/src/ai/word-patches.ts';

describe('fresh curriculum imports accept reviewed follow-up meanings', () => {
  it.each([
    'word-patches-to-2026-10-20.json',
    'word-patches-wet-toilet-2026-10-20.json',
  ])('applies %s to the manual baseline and remains idempotent', (file) => {
    const patches = JSON.parse(fs.readFileSync(`data/content/${file}`, 'utf8'));
    const entries = new Set(patches.patches.map((p: { entry: string }) => p.entry));
    const curriculum = readCurriculum('../data/curriculum/ocr/level3_list.tsv');
    const manual = readManualMeanings('../v2/manual_meanings.tsv', curriculum);
    const words = curriculum.filter(word => entries.has(word.headword));
    const db = openDb(':memory:');
    try {
      upsertCurriculum(db, curriculum, new Map(), 'kb2022', { manual });
      const before = db.prepare('SELECT * FROM words').all();
      expect(applyWordPatches(db, patches)).toMatchObject({ planned: 1, written: 0 });
      expect(db.prepare('SELECT * FROM words').all()).toEqual(before);
      expect(applyWordPatches(db, patches, true)).toMatchObject({ written: 1 });
      expect(applyWordPatches(db, patches, true)).toMatchObject({ planned: 0, unchanged: words.length, written: 0 });
    } finally {
      db.close();
    }
  });

  it('accepts only explicitly recorded alternative originals', () => {
    const db = openDb(':memory:');
    const input = { format: 'vocab-word-patches', version: 1, patches: [{
      entry: 'wet', field: 'meaning_zh', expected: 'raw baseline',
      expectedAlternatives: ['manual baseline'], value: 'reviewed meaning', source: 'reviewed follow-up',
    }] };
    try {
      db.prepare("INSERT INTO words(headword,source,meaning_zh,meaning_raw) VALUES ('wet','kb2022','manual baseline','raw baseline')").run();
      expect(applyWordPatches(db, input, true)).toMatchObject({ written: 1 });
      expect(db.prepare('SELECT meaning_raw FROM words').get()).toEqual({ meaning_raw: 'raw baseline' });
      db.prepare("UPDATE words SET meaning_zh='unrecognized edit'").run();
      expect(() => applyWordPatches(db, input, true)).toThrow('stale word patch');
      expect(db.prepare('SELECT meaning_zh FROM words').get()).toEqual({ meaning_zh: 'unrecognized edit' });
      expect(() => applyWordPatches(db, { ...input, patches: [{ ...input.patches[0], expectedAlternatives: [123] }] }, true)).toThrow('invalid word patch');
    } finally {
      db.close();
    }
  });
});
