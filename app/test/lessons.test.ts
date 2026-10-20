import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
import { manageLesson } from '../web/src/content/lesson-samples/manage.ts';
import { openDb } from '../server/src/db.ts';
import { buildApp } from '../server/src/app.ts';
import { snapshot } from './p2-helpers.ts';

const directories: string[] = [];
const directory = () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(),'vocab-lessons-')); directories.push(dir); return dir; };
afterEach(() => directories.splice(0).forEach(dir => fs.rmSync(dir,{recursive:true,force:true})));
const copy = () => structuredClone(manageLesson);
const word = {id:825,headword:'manage'};

it('accepts the reviewed lesson and enforces identity, example assignments and reference integrity', () => {
  expect(validateLesson(copy(),word).ok).toBe(true);
  expect(validateLesson(copy(),{id:826,headword:'manage'}).ok).toBe(false);
  const mismatch = copy(); mismatch.senses[0].examples[0].senseId='another-sense';
  expect(validateLesson(mismatch).ok).toBe(false);
  const reference = copy(); reference.senses[0].sourceIds=['invented-source'];
  expect(validateLesson(reference).ok).toBe(false);
  const family = copy(); family.wordFamily[0].example.senseId='unknown-sense';
  expect(validateLesson(family).ok).toBe(false);
  const confusion = copy(); confusion.confusions[0].items[0].example.senseId='unknown-sense';
  expect(validateLesson(confusion).ok).toBe(false);
});

it('requires explanation for inapplicable relations or families without forcing invented content', () => {
  const lesson = copy(); lesson.senses[0].relatedExpressions.contrasting=[]; lesson.wordFamily=[];
  expect(validateLesson(lesson).ok).toBe(false);
  lesson.senses[0].relatedExpressions.contrastingNote='这个意思下没有常用的直接反义词。';
  lesson.wordFamilyNote='这里按完整单词记忆，不强行拆成词根。';
  expect(validateLesson(lesson).ok).toBe(true);
  lesson.senses[0].examples.pop();
  expect(validateLesson(lesson).ok).toBe(false);
});

it('separates recommended links from verified sources and rejects unsafe or malformed data', () => {
  const lesson = copy(); const source:any=lesson.sources[0];
  source.verification='recommended';
  expect(validateLesson(lesson).ok).toBe(false);
  delete source.checkedAt;
  expect(validateLesson(lesson).ok).toBe(true);
  source.url='javascript:alert(1)'; expect(validateLesson(lesson).ok).toBe(false);
  for(const invalid of [null,[],{}, {sources:[null],senses:[null]}]) expect(validateLesson(invalid).ok).toBe(false);
});

it('serves only reviewed matching files and invalidates cached content after replacement or removal', () => {
  const dir=directory(), file=path.join(dir,'825.json'), read=createLessonReader(dir);
  expect(read(word).status).toBe('pending');
  const lesson=copy(); lesson.editorial.status='draft'; fs.writeFileSync(file,JSON.stringify(lesson));
  expect(read(word).status).toBe('pending');
  lesson.editorial.status='reviewed'; fs.writeFileSync(file+'.new',JSON.stringify(lesson)); fs.renameSync(file+'.new',file);
  expect(read(word).status).toBe('ready');
  expect(read({...word,headword:'wrong'}).status).toBe('pending');
  expect(read(word).status).toBe('ready');
  fs.writeFileSync(file,'not json'); expect(read(word).status).toBe('pending');
  fs.rmSync(file); expect(read(word).status).toBe('pending');
});

it('rejects paths outside the content directory and oversized files', () => {
  const dir=directory(), outside=directory(), file=path.join(dir,'825.json');
  fs.writeFileSync(path.join(outside,'825.json'),JSON.stringify(copy())); fs.symlinkSync(path.join(outside,'825.json'),file);
  const read=createLessonReader(dir); expect(read(word).status).toBe('pending');
  fs.rmSync(file); fs.writeFileSync(file,' '.repeat(512*1024+1)); expect(read(word).status).toBe('pending');
  expect(read({id:NaN,headword:'manage'}).status).toBe('pending');
});

it('lesson requests preserve every database table and validate absent or malformed word ids', async () => {
  const db=openDb(':memory:'),dir=directory();
  db.prepare("INSERT INTO words(id,headword,source) VALUES (?,?,'kb2022')").run(825,'manage');
  db.prepare("INSERT INTO words(id,headword,source) VALUES (?,?,'kb2022')").run(826,'absent');
  fs.writeFileSync(path.join(dir,'825.json'),JSON.stringify(copy()));
  const app=buildApp(db,{lessonDir:dir}), before=snapshot(db);
  expect((await app.inject('/api/word/825/lesson')).json()).toMatchObject({status:'ready',lesson:{wordId:825,headword:'manage'}});
  expect((await app.inject('/api/word/826/lesson')).json()).toEqual({status:'pending',lesson:null});
  expect((await app.inject('/api/word/999/lesson')).statusCode).toBe(404);
  for(const id of ['0','0825','1e2','NaN']) expect((await app.inject(`/api/word/${id}/lesson`)).statusCode).toBe(400);
  expect(snapshot(db)).toEqual(before);
  await app.close(); db.close();
});
