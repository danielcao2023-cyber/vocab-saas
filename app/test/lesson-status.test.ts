import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { lessonStatus } from '../scripts/lesson-status.ts';
import { createLessonReader } from '../server/src/lessons.ts';
import { manageLesson } from '../web/src/content/lesson-samples/manage.ts';

const directories: string[] = [];
const directory = () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-lesson-status-')); directories.push(dir); return dir; };
afterEach(() => directories.splice(0).forEach(dir => fs.rmSync(dir, { recursive: true, force: true })));

function fixture() {
  const root = directory(), content = path.join(root, 'lessons'), database = path.join(root, 'words.db');
  fs.mkdirSync(content);
  const db = new Database(database);
  db.exec(`CREATE TABLE words (id INTEGER PRIMARY KEY, headword TEXT, meaning_zh TEXT, phonetic TEXT, pos TEXT, source TEXT);
    CREATE TABLE word_forms (word_id INTEGER, form TEXT, kind TEXT);
    CREATE TABLE learning_sentinel (id INTEGER PRIMARY KEY, secret TEXT);
    INSERT INTO learning_sentinel VALUES (1, 'untouched');
    INSERT INTO words VALUES (825, 'manage', '管理', '', 'v.', 'kb2022');`);
  db.close();
  return { root, content, database, file: path.join(content, '825.json') };
}

it('counts only matching curriculum lessons and does not migrate or write the vocabulary database', () => {
  const { database, content, file } = fixture();
  const db = new Database(database);
  db.prepare('INSERT INTO words VALUES (?, ?, ?, ?, ?, ?)').run(826, 'missing', '', '', '', 'kb2022');
  db.prepare('INSERT INTO words VALUES (?, ?, ?, ?, ?, ?)').run(827, 'outside-curriculum', '', '', '', 'sample');
  db.close();
  fs.writeFileSync(file, JSON.stringify(manageLesson));
  const before = fs.readFileSync(database);
  expect(lessonStatus(database, content)).toMatchObject({ total: 2, counts: { reviewed: 1, draft: 0, invalid: 0, missing: 1 }, complete: false });
  expect(fs.readFileSync(database)).toEqual(before);

  const wrong = structuredClone(manageLesson); wrong.headword = 'wrong';
  fs.writeFileSync(file, JSON.stringify(wrong));
  expect(lessonStatus(database, content)).toMatchObject({ counts: { reviewed: 0, invalid: 1, missing: 1 }, complete: false });
});

it('never counts an outside symlink as reviewed when the lesson reader refuses it', () => {
  const { root, database, content, file } = fixture();
  const outside = path.join(root, 'outside.json');
  fs.writeFileSync(outside, JSON.stringify(manageLesson));
  fs.symlinkSync(outside, file);
  expect(createLessonReader(content)({ id: 825, headword: 'manage' }).status).toBe('pending');
  expect(lessonStatus(database, content)).toMatchObject({ counts: { reviewed: 0, invalid: 1 }, complete: false });
});

it('never counts oversized but structurally valid JSON as reviewed when it cannot be served', () => {
  const { database, content, file } = fixture();
  fs.writeFileSync(file, ' '.repeat(512 * 1024) + JSON.stringify(manageLesson));
  expect(createLessonReader(content)({ id: 825, headword: 'manage' }).status).toBe('pending');
  expect(lessonStatus(database, content)).toMatchObject({ counts: { reviewed: 0, invalid: 1 }, complete: false });
});

it('does not label a completed small database as the full 1600-word curriculum', () => {
  const { database, content, file } = fixture();
  fs.writeFileSync(file, JSON.stringify(manageLesson));
  expect(lessonStatus(database, content)).toMatchObject({ total: 1, counts: { reviewed: 1 }, complete: true, expectedTotal: 1600, fullCurriculumComplete: false });
});
