import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WordLesson, WordLessonResponse } from '../../shared/lesson.ts';

export const defaultLessonDir = fileURLToPath(new URL('../../data/lessons/', import.meta.url));
type ExpectedWord = { id: number; headword: string };
type Validation = { ok: true; lesson: WordLesson } | { ok: false; errors: string[] };
const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Transport and editorial completeness checks, not a claim of linguistic correctness. */
export function validateLesson(input: unknown, expected?: ExpectedWord): Validation {
  const errors: string[] = [];
  const fail = (key: string, message: string) => { if (errors.length < 100) errors.push(`${key}: ${message}`); };
  const str = (v: unknown, key: string, allowEmpty = false) => {
    if (typeof v !== 'string' || (!allowEmpty && !v.trim()) || v.length > 8000) fail(key, 'expected a bounded string');
  };
  const obj = (v: unknown, key: string): Record<string, any> => { if (!object(v)) { fail(key, 'expected object'); return {}; } return v; };
  const list = (v: unknown, key: string, min = 0, max = 80): any[] => {
    if (!Array.isArray(v)) { fail(key, 'expected array'); return []; }
    if (v.length < min || v.length > max) fail(key, `expected ${min}–${max} entries`);
    return v.slice(0, max);
  };
  const strings = (v: unknown, key: string, min = 0) => list(v, key, min).forEach((s, i) => str(s, `${key}[${i}]`));
  const fields = (v: Record<string, any>, key: string, names: string[]) => names.forEach(n => str(v[n], `${key}.${n}`));
  const slug = (v: unknown, key: string) => { if (typeof v !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(v)) fail(key, 'invalid identifier'); };
  const date = (v: unknown, key: string) => { if (typeof v !== 'string' || !/^\d{4}-\d\d-\d\d(?:T.*)?$/.test(v) || !Number.isFinite(Date.parse(v))) fail(key, 'invalid date'); };
  const lesson = obj(input, 'lesson');
  if (lesson.schemaVersion !== 1) fail('schemaVersion', 'unsupported version');
  if (!Number.isSafeInteger(lesson.wordId) || lesson.wordId < 1) fail('wordId', 'invalid word id');
  if (expected && (lesson.wordId !== expected.id || lesson.headword !== expected.headword)) fail('identity', 'lesson does not match word');
  slug(lesson.id, 'id');
  fields(lesson, 'lesson', ['headword', 'partOfSpeech', 'headline', 'takeaway', 'levelHint']);
  strings(lesson.studyPlan, 'studyPlan', 1);
  const sourceIds = new Set<string>();
  list(lesson.sources, 'sources', 1).forEach((raw, i) => {
    const key = `sources[${i}]`, source = obj(raw, key);
    slug(source.id, `${key}.id`);
    if (sourceIds.has(source.id)) fail(key, 'duplicate source id');
    sourceIds.add(source.id);
    fields(source, key, ['title', 'url']); strings(source.supports, `${key}.supports`, 1);
    try { const u = new URL(source.url); if (u.protocol !== 'https:' || u.username || u.password) fail(key, 'source must use public HTTPS'); } catch { fail(key, 'invalid source URL'); }
    if (source.verification === 'verified') date(source.checkedAt, `${key}.checkedAt`);
    else if (source.verification !== 'recommended' || source.checkedAt != null) fail(key, 'invalid verification provenance');
  });
  const refs = (v: unknown, key: string) => list(v, key).forEach(id => { if (!sourceIds.has(id)) fail(key, `unknown source ${String(id).slice(0,100)}`); });
  const exampleIds = new Set<string>();
  const exampleSenseRefs: { key: string; senseId: unknown }[] = [];
  const example = (raw: unknown, key: string, senseId?: string) => {
    const ex = obj(raw, key); slug(ex.id, `${key}.id`); fields(ex, key, ['senseId', 'en', 'zh']);
    if (ex.note !== undefined) str(ex.note, `${key}.note`, true);
    if (exampleIds.has(ex.id)) fail(key, 'duplicate example id');
    exampleIds.add(ex.id);
    exampleSenseRefs.push({key, senseId:ex.senseId});
    if (senseId && ex.senseId !== senseId) fail(key, 'example assigned to another sense');
  };
  const pronunciation = obj(lesson.pronunciation, 'pronunciation');
  for (const field of ['ipa', 'uk', 'us', 'accentNote']) str(pronunciation[field], `pronunciation.${field}`, true);
  strings(pronunciation.notes, 'pronunciation.notes', 1); refs(pronunciation.sourceIds, 'pronunciation.sourceIds');
  list(lesson.forms, 'forms', 1).forEach((raw, i) => {
    const key = `forms[${i}]`, form = obj(raw, key); fields(form, key, ['label', 'form', 'note']); str(form.ipa, `${key}.ipa`, true);
  });
  const senseIds = new Set<string>();
  list(lesson.senses, 'senses', 1, 30).forEach((raw, i) => {
    const key = `senses[${i}]`, sense = obj(raw, key); slug(sense.id, `${key}.id`);
    if (senseIds.has(sense.id)) fail(key, 'duplicate sense id'); senseIds.add(sense.id);
    fields(sense, key, ['title', 'meaning', 'usageNote']);
    list(sense.examples, `${key}.examples`, 2, 12).forEach((ex, j) => example(ex, `${key}.examples[${j}]`, sense.id));
    let usages = 0;
    for (const field of ['patterns', 'collocations']) {
      const entries = list(sense[field], `${key}.${field}`); usages += entries.length;
      entries.forEach((raw, j) => { const k = `${key}.${field}[${j}]`, entry = obj(raw, k); fields(entry, k, ['en', 'zh', 'note']); if (!['sentence-pattern','common-collocation','fixed-expression'].includes(entry.kind)) fail(k, 'invalid usage kind'); });
    }
    if (usages < 2) fail(key, 'each sense needs at least two patterns or collocations');
    const related = obj(sense.relatedExpressions, `${key}.relatedExpressions`);
    for (const field of ['similar', 'contrasting']) {
      const entries = list(related[field], `${key}.relatedExpressions.${field}`);
      entries.forEach((raw, j) => fields(obj(raw, key), `${key}.${field}[${j}]`, ['en','zh','note']));
      if (!entries.length || related[`${field}Note`] !== undefined) str(related[`${field}Note`], `${key}.relatedExpressions.${field}Note`, !!entries.length);
    }
    refs(sense.sourceIds, `${key}.sourceIds`);
  });
  list(lesson.lessCommonSenses, 'lessCommonSenses').forEach((raw, i) => {
    const key = `lessCommonSenses[${i}]`, sense = obj(raw, key); slug(sense.id, `${key}.id`);
    if (senseIds.has(sense.id)) fail(key, 'duplicate sense id'); senseIds.add(sense.id);
    fields(sense, key, ['title','meaning','note']); example(sense.example, `${key}.example`, sense.id); refs(sense.sourceIds, `${key}.sourceIds`);
  });
  list(lesson.confusions, 'confusions').forEach((raw, i) => {
    const key = `confusions[${i}]`, confusion = obj(raw, key); slug(confusion.id, `${key}.id`);
    fields(confusion, key, ['title','summary','takeaway']); refs(confusion.sourceIds, `${key}.sourceIds`);
    list(confusion.items, `${key}.items`, 2).forEach((raw, j) => { const k = `${key}.items[${j}]`, item = obj(raw, k); fields(item,k,['label','note']); example(item.example, `${k}.example`); });
  });
  const etymology = obj(lesson.etymology, 'etymology'); fields(etymology,'etymology',['summary','caveat']); refs(etymology.sourceIds,'etymology.sourceIds');
  list(etymology.stages,'etymology.stages').forEach((raw,i)=>fields(obj(raw,`etymology.stages[${i}]`),`etymology.stages[${i}]`,['language','form','meaning']));
  const family = list(lesson.wordFamily, 'wordFamily');
  family.forEach((raw,i)=>{const key=`wordFamily[${i}]`,member=obj(raw,key);fields(member,key,['word','partOfSpeech','meaning','formation','spellingNote']);example(member.example,`${key}.example`);refs(member.sourceIds,`${key}.sourceIds`);});
  if (!family.length || lesson.wordFamilyNote !== undefined) str(lesson.wordFamilyNote, 'wordFamilyNote', !!family.length);
  for (const ref of exampleSenseRefs) if (!senseIds.has(ref.senseId as string)) fail(ref.key, 'example refers to an unknown sense');
  const memory = obj(lesson.memoryAid,'memoryAid'); fields(memory,'memoryAid',['title','story','caveat']);
  list(memory.cues,'memoryAid.cues',1).forEach((raw,i)=>fields(obj(raw,`memoryAid.cues[${i}]`),`memoryAid.cues[${i}]`,['label','text']));
  const editorial = obj(lesson.editorial,'editorial'); fields(editorial,'editorial',['authorship','scope']);
  if (!['draft','reviewed'].includes(editorial.status)) fail('editorial.status','invalid status');
  date(editorial.checkedAt,'editorial.checkedAt');
  return errors.length ? {ok:false,errors} : {ok:true,lesson:input as WordLesson};
}

/** Shared disk boundary for both the public reader and the coverage audit. */
export function inspectLessonFile(directory: string, id: number) {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('invalid word id');
  const root=fs.realpathSync(directory), file=fs.realpathSync(path.join(root,`${id}.json`));
  if(path.dirname(file)!==root) throw new Error('lesson is outside content directory');
  const stat=fs.statSync(file);
  if(!stat.isFile()||stat.size>512*1024) throw new Error('invalid lesson file');
  return {file,stat};
}

/** Reads versioned content without touching any learning tables. Only reviewed lessons are served. */
export function createLessonReader(directory = defaultLessonDir) {
  const cache = new Map<number, { fingerprint: string; response: WordLessonResponse }>();
  return (word: ExpectedWord): WordLessonResponse => {
    const pending: WordLessonResponse = { status:'pending', lesson:null };
    if (!Number.isSafeInteger(word.id) || word.id < 1) return pending;
    try {
      const {file,stat}=inspectLessonFile(directory,word.id);
      const fingerprint = `${word.headword}:${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
      const cached = cache.get(word.id); if(cached?.fingerprint===fingerprint) return cached.response;
      const validated = validateLesson(JSON.parse(fs.readFileSync(file,'utf8')), word);
      const response: WordLessonResponse = validated.ok && validated.lesson.editorial.status==='reviewed' ? {status:'ready',lesson:validated.lesson} : pending;
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(word.id,{fingerprint,response}); return response;
    } catch { return pending; }
  };
}
