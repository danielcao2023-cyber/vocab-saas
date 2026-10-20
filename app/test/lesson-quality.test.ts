import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { lessonQuality } from '../scripts/lesson-quality.ts';
import { manageLesson } from '../web/src/content/lesson-samples/manage.ts';

const dirs: string[] = [], hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
afterEach(() => dirs.splice(0).forEach(dir => fs.rmSync(dir, { recursive: true, force: true })));
function fixture(names = ['manage']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-quality-')); dirs.push(root);
  const directory = path.join(root, 'lessons'), auditDirectory = path.join(root, 'lesson-audit'), database = path.join(root, 'vocab.db');
  fs.mkdirSync(directory); fs.mkdirSync(auditDirectory);
  const db = new Database(database);
  db.exec('CREATE TABLE words(id INTEGER,headword TEXT,meaning_zh TEXT,phonetic TEXT,pos TEXT,source TEXT); CREATE TABLE word_forms(word_id INTEGER,form TEXT,kind TEXT); CREATE TABLE learning_secret(secret TEXT); INSERT INTO learning_secret VALUES (\'never inspect me\');');
  const lessons = names.map((headword, index) => {
    const id = 825 + index, lesson = structuredClone(manageLesson); lesson.wordId = id; lesson.headword = headword;
    db.prepare("INSERT INTO words(id,headword,source) VALUES (?,?,'kb2022')").run(id, headword);
    return lesson;
  }); db.close();
  const save = () => lessons.forEach(lesson => fs.writeFileSync(path.join(directory, `${lesson.wordId}.json`), JSON.stringify(lesson)));
  save(); return { root, directory, auditDirectory, database, lessons, save };
}
function pipelineAudit(lesson: typeof manageLesson, reviewChanges: Record<string, unknown> = {}) {
  const input = { id: lesson.wordId, headword: lesson.headword, meaning_zh: null, phonetic: null, pos: null, forms: [] };
  const review = { verdict: 'pass', issues: [], patches: [], senseInventory: lesson.senses.map(sense => ({ sense: sense.title, coveredBy: [sense.id], assessment: 'Covered.' })), ...reviewChanges };
  return { input, review, provenance: { wordId: lesson.wordId, inputHash: hash(input), finalHash: hash(lesson), reviewHash: hash(review), sourceEvidence: [] } };
}

it('counts explained empty relations/families without judging them wrong, and excludes honest editorial metadata from placeholder scans', () => {
  const f = fixture(), lesson = f.lessons[0];
  lesson.senses[0].relatedExpressions.similar = []; lesson.senses[0].relatedExpressions.similarNote = '本义下没有可直接替换的近义表达。';
  lesson.senses[0].relatedExpressions.contrasting = []; lesson.senses[0].relatedExpressions.contrastingNote = '没有合适的直接反义表达。';
  lesson.wordFamily = []; lesson.wordFamilyNote = '按完整单词记忆，不强行拆词。';
  lesson.editorial.scope = 'AI 原稿仍待完善，独立审阅记录另存。'; f.save();
  const before = fs.readFileSync(f.database), report = lessonQuality(f.database, f);
  expect(report.coverage.reviewed).toMatchObject({ sensesWithSimilarExplanation: 1, sensesWithContrastingExplanation: 1, lessonsWithWordFamilyExplanation: 1 });
  expect(report.findings.some(finding => finding.code === 'student-placeholder')).toBe(false);
  expect(report.semanticAcceptance).toBe('not-determined-by-rule-report'); expect(report.fullCurriculumFilesReviewed).toBe(false);
  expect(JSON.stringify(report)).not.toContain('never inspect me'); expect(fs.readFileSync(f.database)).toEqual(before);
});

it('reports student placeholders, explicit other-word text and repeated stories/examples with inspectable locations', () => {
  const f = fixture(['manage', 'accept', 'visit']);
  for (const lesson of f.lessons) {
    lesson.memoryAid.story = '想象同一个通用场景来记住这个单词。';
    lesson.senses[0].examples[0].en = 'They waited beside the school gate after lunch.';
    lesson.senses[0].examples[1].en = `We can ${lesson.headword} the new school project together this week.`;
    lesson.forms = [{ label: '原形', form: lesson.headword, ipa: '', note: '基础形式。' }];
  }
  f.lessons[0].headline = '今天我们学习的单词是accept'; f.lessons[0].takeaway = '此处填写重点'; f.save();
  const report = lessonQuality(f.database, f), codes = report.findings.map(finding => finding.code);
  expect(codes).toEqual(expect.arrayContaining(['student-placeholder', 'declared-other-headword', 'repeated-memory-story', 'repeated-core-example', 'target-swapped-sentence-template']));
  expect(report.findings.find(finding => finding.code === 'repeated-memory-story')?.locations).toHaveLength(3);
});

it('flags production prose and unexplained historical forms, while allowing genuine uncertainty and ordinary learning examples', () => {
  const f = fixture(), lesson = f.lessons[0];
  lesson.pronunciation.notes[0] = '不要按旧音标把这个音读成长元音。';
  lesson.etymology.summary = '给定资料说明这个词来自古英语。';
  lesson.etymology.stages[0].meaning = '所给材料未单列此形式的具体释义。';
  lesson.editorial.scope = '给定资料的限制和旧音标修订记录保存在审计中。'; f.save();
  const report = lessonQuality(f.database, f), flags = report.findings.filter(item => ['student-production-prose', 'historical-form-meaning-gap'].includes(item.code));
  expect(flags).toHaveLength(4);
  expect(flags.every(item => item.severity === 'review' && !item.locations[0].path.startsWith('/editorial'))).toBe(true);
  expect(flags.find(item => item.code === 'historical-form-meaning-gap')?.locations[0].path).toBe('/etymology/stages/0/meaning');
  lesson.pronunciation.notes[0] = '第二音节轻读。';
  lesson.etymology.summary = '这个词更早的起源仍有争议，不能确定完整的演变路径。';
  lesson.etymology.stages = [];
  lesson.senses[0].examples[0].zh = '我尚未完成这项任务。'; f.save();
  expect(lessonQuality(f.database, f).findings.some(item => ['student-production-prose', 'historical-form-meaning-gap'].includes(item.code))).toBe(false);
});

it('distinguishes a patch-addressed issue from an unresolved error and detects mismatched audit hashes', () => {
  const f = fixture(), lesson = f.lessons[0];
  const audit = pipelineAudit(lesson, { verdict: 'revised', issues: [{ severity: 'error', location: '/headline', message: 'Fix title' }, { severity: 'error', location: '/etymology', message: 'Unsupported history' }, { severity: 'uncertainty', location: '/pronunciation', message: 'Accent uncertain' }, { severity: 'error', location: '/headline、/senses 中的说明', message: 'Descriptive compound location' }, { severity: 'error', location: '/lessCommonSenses', message: 'Add sense' }], patches: [{ op: 'replace', path: '/headline', valueJson: '"new"', expectedValueJson: '"old"' }, { op: 'add', path: '/lessCommonSenses/-', valueJson: '{}' }] });
  fs.writeFileSync(path.join(f.auditDirectory, '825.json'), JSON.stringify(audit));
  const report = lessonQuality(f.database, f), row: any = report.words[0];
  expect(row.audit.issues[0].resolution).toBe('patch-addressed-not-semantically-verified');
  expect(row.audit.issues[1].resolution).toBe('unresolved-or-unlinked');
  expect(row.audit.issues[3].resolution).toBe('manual-issue-to-patch-link-required');
  expect(row.audit.issues[4].resolution).toBe('patch-addressed-not-semantically-verified');
  expect(report.findings.map(finding => finding.code)).toEqual(expect.arrayContaining(['review-error-unresolved', 'review-uncertainty', 'review-issue-link-unverified']));
  expect(report.findings.find(finding => finding.code === 'review-issue-link-unverified')?.message).toContain('not evidence');
  audit.provenance.finalHash = '0'.repeat(64); fs.writeFileSync(path.join(f.auditDirectory, '825.json'), JSON.stringify(audit));
  expect(lessonQuality(f.database, f).findings.map(finding => finding.code)).toContain('audit-final-hash-mismatch');
});

it('recognizes final-byte-bound independent editor audits without treating superseded machine issues as unresolved', () => {
  const f = fixture(), file = path.join(f.directory, '825.json');
  const audit = { schemaVersion: 1, wordId: 825, headword: 'manage', lessonSha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    modelReview: { result: { verdict: 'reject', issues: [{ severity: 'error', location: '/senses', message: 'Earlier draft issue' }] } },
    editorialReview: { method: 'independent Codex agent full-content read', reviewer: 'independent-editor', status: 'passed', candidateSha256: 'a'.repeat(64), humanTeacherReviewed: false, evidence: { revision: { changes: ['Revised and independently checked.'] } } }, sourceEvidence: [] };
  fs.writeFileSync(path.join(f.auditDirectory, '825.json'), JSON.stringify(audit));
  const report = lessonQuality(f.database, f), row: any = report.words[0];
  expect(row.audit).toMatchObject({ status: 'editor-record-bound', priorModelVerdict: 'reject', humanTeacherReviewed: false, candidateMatchesPublishedBytes: false });
  expect(row.audit.issues[0].resolution).toBe('superseded-by-recorded-independent-editor-review');
  expect(report.findings.some(finding => finding.code === 'review-error-unresolved')).toBe(false);
  fs.appendFileSync(file, '\n');
  expect(lessonQuality(f.database, f).findings.map(finding => finding.code)).toContain('audit-final-hash-mismatch');
});

it('keeps unknown audit formats unverified and reports historical evidence gaps without forcing a word root', () => {
  const f = fixture(), lesson = f.lessons[0];
  lesson.sources = lesson.sources.map(({ checkedAt: _date, ...source }: any) => ({ ...source, verification: 'recommended' })); f.save();
  fs.writeFileSync(path.join(f.auditDirectory, '825.json'), JSON.stringify({ format: 'future-editor-schema', passed: true }));
  let report = lessonQuality(f.database, f);
  expect((report.words[0] as any).audit.status).toBe('unsupported');
  expect(report.findings.map(finding => finding.code)).toContain('historical-claim-evidence-gap');
  lesson.etymology.stages = []; lesson.etymology.summary = '作为完整单词记忆，不强行拆成词根。'; f.save(); report = lessonQuality(f.database, f);
  expect(report.findings.map(finding => finding.code)).not.toContain('historical-claim-evidence-gap');
});

it('refuses report output that would overwrite the input database or content', () => {
  const f = fixture(), before = fs.readFileSync(f.database), script = fileURLToPath(new URL('../scripts/lesson-quality.ts', import.meta.url));
  for (const output of [f.database, path.join(f.directory, '825.json')]) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', script, '--db', f.database, '--directory', f.directory, '--out', output], { encoding: 'utf8', timeout: 10000 });
    expect(result.status).toBe(1); expect(result.stderr).toContain('--out must');
  }
  expect(fs.readFileSync(f.database)).toEqual(before);
});
