import { afterEach, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import Database from 'better-sqlite3';
import ts from 'typescript';
import { applyLessonPatches, generateLessons } from '../scripts/lesson-generate.ts';
import { manageLesson } from '../web/src/content/lesson-samples/manage.ts';
import { validateLesson } from '../server/src/lessons.ts';
import type { Runner, RunnerRequest } from '../server/src/ai/codex-runner.ts';

const directories: string[] = [];
afterEach(() => directories.splice(0).forEach(dir => fs.rmSync(dir, { recursive: true, force: true })));
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-generate-test-')); directories.push(root);
  const database = path.join(root, 'vocab.db'), db = new Database(database);
  db.exec(`CREATE TABLE words (id INTEGER PRIMARY KEY, headword TEXT, meaning_zh TEXT, phonetic TEXT, pos TEXT, source TEXT);
    CREATE TABLE word_forms (word_id INTEGER, form TEXT, kind TEXT);
    CREATE TABLE learning_sentinel (id INTEGER PRIMARY KEY, value TEXT);
    INSERT INTO learning_sentinel VALUES (1, 'unchanged');
    INSERT INTO words VALUES (825, 'manage', '管理', '', 'v.', 'kb2022');`);
  db.close();
  const validator = path.join(root, 'app/server/src/lessons.ts');
  fs.mkdirSync(path.dirname(validator), { recursive: true });
  const source = fs.readFileSync(fileURLToPath(new URL('../server/src/lessons.ts', import.meta.url)), 'utf8');
  // The runtime loads an mtime-qualified path; preserve the real validator logic
  // while avoiding Vite treating an external temporary .ts?mtime path as plain JS.
  fs.writeFileSync(validator, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  const draft = structuredClone(manageLesson);
  draft.editorial.status = 'draft'; draft.etymology.stages = [];
  draft.sources = draft.sources.map(({ checkedAt: _checkedAt, ...source }: any) => ({ ...source, verification: 'recommended' }));
  const opts = { root, execute: true, publish: true, concurrency: 1, attempts: 1, sourceFetch: false };
  return { root, database, draft, opts, destination: path.join(root, 'app/data/lessons/825.json') };
}

function output(request: RunnerRequest, value: unknown) {
  fs.mkdirSync(request.directory, { recursive: true });
  const stdout = JSON.stringify(value);
  fs.writeFileSync(path.join(request.directory, 'output.json'), stdout);
  return stdout;
}
const passingReview = (draft: typeof manageLesson) => ({ verdict: 'pass', issues: [], patches: [], coverageAssessment: 'All supplied senses were checked.', senseInventory: draft.senses.map(sense => ({ sense: sense.title, coveredBy: [sense.id], assessment: 'Covered.' })) });

it.each(['generate', 'review'] as const)('preserves the failed %s validation after a later successful attempt', async stage => {
  const { root, database, draft, opts, destination } = fixture();
  let generated = 0, reviewed = 0;
  const runner: Runner = async request => {
    expect(request.mcpPolicy?.disabledServers).toEqual(['utp', 'node_repl']);
    generated++;
    return { stdout: output(request, stage === 'generate' && generated === 1 ? { ...draft, forms: [] } : draft), durationMs: 1, exitCode: 0 };
  };
  const reviewer: Runner = async request => {
    expect(request.mcpPolicy?.disabledPluginServers).toContainEqual({ plugin: 'build-ios-apps@openai-curated-remote', server: 'xcodebuildmcp' });
    reviewed++;
    const review = stage === 'review' && reviewed === 1 ? { ...passingReview(draft), verdict: 'revised', patches: [{ op: 'replace', path: '/headline', expectedValueJson: '"stale"', valueJson: '"Replacement"' }] } : passingReview(draft);
    return { stdout: output(request, review), durationMs: 1, exitCode: 0 };
  };
  const realTimeout = globalThis.setTimeout;
  // Skip only the retry backoff; dynamic module imports must keep real timers.
  const timer = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: any, delay?: number, ...args: any[]) => realTimeout(callback, delay === 5000 ? 0 : delay, ...args)) as typeof setTimeout);
  try {
    await generateLessons(database, { ...opts, attempts: 2 }, runner, reviewer);
  } finally { timer.mockRestore(); }
  expect(fs.existsSync(destination)).toBe(true);
  const progress = JSON.parse(fs.readFileSync(path.join(root, '.tmp/lesson-generation/progress.json'), 'utf8'));
  const directory = progress.words[0].directory;
  const failed = JSON.parse(fs.readFileSync(path.join(directory, `${stage}-1.validation.json`), 'utf8'));
  const passed = JSON.parse(fs.readFileSync(path.join(directory, `${stage}-2.validation.json`), 'utf8'));
  expect(failed).toMatchObject({ stage, attempt: 1, ok: false, wordId: 825, outputHash: expect.stringMatching(/^[a-f0-9]{64}$/) });
  expect(failed.error).toMatch(stage === 'generate' ? /forms/ : /expected value mismatch/);
  expect(passed).toMatchObject({ stage, attempt: 2, ok: true, error: null });
  expect(progress.words[0].error).toBeUndefined();
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'app/data/lesson-audit/825.json'), 'utf8'));
  expect(audit.provenance.generator.mcpPolicy.disabledServers).toEqual(['utp', 'node_repl']);
  expect(audit.provenance.reviewer.mcpPolicy).toEqual(audit.provenance.generator.mcpPolicy);
});

it('requires the same nonempty teaching arrays in the author schema as at delivery', async () => {
  const { root, database, draft, opts } = fixture();
  const arrayPaths = ['forms', 'studyPlan', 'pronunciation.notes', 'memoryAid.cues', 'sources', 'sources.0.supports', 'confusions.0.items'];
  let calls = 0;
  const runner: Runner = async request => {
    calls++;
    for (const field of arrayPaths) {
      let schema: any = request.schema;
      const segments = field.split('.');
      for (const segment of segments) schema = /^\d+$/.test(segment) ? schema.items : schema.properties[segment];
      expect(schema.minItems).toBe(field.endsWith('.items') ? 2 : 1);
      // A schema that permits this empty array caused real abroad output to fail twice.
      const invalid = structuredClone(draft); let target: any = invalid;
      for (const segment of segments.slice(0, -1)) target = target[segment];
      target[segments.at(-1)!] = [];
      const checked = validateLesson(invalid, { id: 825, headword: 'manage' });
      expect(checked.ok).toBe(false);
    }
    expect(request.prompt).toContain('不变形的副词、介词或连词也须列原形');
    return { stdout: output(request, draft), durationMs: 1, exitCode: 0 };
  };
  const reviewer: Runner = async request => ({ stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 });
  await generateLessons(database, opts, runner, reviewer);
  expect(calls).toBe(1);
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'app/data/lesson-audit/825.json'), 'utf8'));
  expect(audit.provenance.generator.outputSchemaVersion).toBe('sense-lessons-output-v2');
  expect(audit.provenance.generator.outputSchemaHash).toMatch(/^[a-f0-9]{64}$/);
});

it('allows a fully reviewed 13-sense lesson rather than rejecting it at the old private cap', async () => {
  const { database, draft, opts, destination } = fixture();
  while (draft.senses.length < 13) {
    const sense = structuredClone(draft.senses[0]), n = draft.senses.length;
    sense.id = `additional-${n}`;
    sense.examples.forEach((ex, i) => { ex.id = `additional-${n}-${i}`; ex.senseId = sense.id; });
    draft.senses.push(sense);
  }
  const runner: Runner = async request => {
    const schema = request.schema as any;
    expect(schema.properties.senses.maxItems).toBe(30);
    expect(schema.properties.senses.items.properties.examples.maxItems).toBe(12);
    return { stdout: output(request, draft), durationMs: 1, exitCode: 0 };
  };
  const reviewer: Runner = async request => ({ stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 });
  await generateLessons(database, opts, runner, reviewer);
  expect(JSON.parse(fs.readFileSync(destination, 'utf8')).senses).toHaveLength(13);
});

it.each([{ exitCode: 1, timedOut: false }, { exitCode: 0, timedOut: true }])('does not recover a failed generation as publishable content on restart: %j', async failure => {
  const { database, draft, opts, destination } = fixture();
  const databaseBefore = fs.readFileSync(database);
  let generated = 0, reviewed = 0;
  const runner: Runner = async request => { generated++; return { stdout: output(request, draft), durationMs: 1, ...failure }; };
  const reviewer: Runner = async request => { reviewed++; return { stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 }; };
  await generateLessons(database, opts, runner, reviewer);
  expect(fs.existsSync(destination)).toBe(false);
  await generateLessons(database, opts, runner, reviewer);
  expect(generated).toBe(2);
  expect(reviewed).toBe(0);
  expect(fs.existsSync(destination)).toBe(false);
  expect(fs.readFileSync(database)).toEqual(databaseBefore);
});

it('rolls back every patch when a later expected value is stale and rejects identity changes', () => {
  const draft = structuredClone(manageLesson), before = structuredClone(draft);
  expect(() => applyLessonPatches(draft, [
    { op: 'replace', path: '/headline', expectedValueJson: JSON.stringify(draft.headline), valueJson: '"A replacement"' },
    { op: 'replace', path: '/takeaway', expectedValueJson: '"stale"', valueJson: '"Incorrect replacement"' },
  ])).toThrow(/expected value mismatch/);
  expect(draft).toEqual(before);
  expect(() => applyLessonPatches(draft, [{ op: 'replace', path: '/wordId', expectedValueJson: '825', valueJson: '826' }])).toThrow(/unsafe patch path/);
});

it('holds one lock for the full generation and review, and preserves the vocabulary database', async () => {
  const { root, database, draft, opts, destination } = fixture();
  const databaseBefore = fs.readFileSync(database);
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }), entered = new Promise<void>(resolve => { started = resolve; });
  const runner: Runner = async request => { started(); await gate; return { stdout: output(request, draft), durationMs: 1, exitCode: 0 }; };
  const reviewer: Runner = async request => ({ stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 });
  const first = generateLessons(database, opts, runner, reviewer);
  await entered;
  try {
    await expect(generateLessons(database, opts, runner, reviewer)).rejects.toThrow(/already running/);
    expect(fs.readFileSync(path.join(root, '.tmp/lesson-generation/generate.lock'), 'utf8')).toBe(String(process.pid));
  } finally { release(); }
  await first;
  expect(JSON.parse(fs.readFileSync(path.join(root, '.tmp/lesson-generation/progress.json'), 'utf8')).words[0].error).toBeUndefined();
  expect(fs.existsSync(path.join(root, '.tmp/lesson-generation/generate.lock'))).toBe(false);
  expect(JSON.parse(fs.readFileSync(destination, 'utf8')).editorial.status).toBe('reviewed');
  expect(fs.readFileSync(database)).toEqual(databaseBefore);
});

it('resumes an unchanged successful review without model calls and publishes its matching audit', async () => {
  const { root, database, draft, opts, destination } = fixture();
  let generated = 0, reviewed = 0;
  const runner: Runner = async request => { generated++; return { stdout: output(request, draft), durationMs: 1, exitCode: 0 }; };
  const reviewer: Runner = async request => { reviewed++; return { stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 }; };
  await generateLessons(database, { ...opts, publish: false }, runner, reviewer);
  expect(fs.existsSync(destination)).toBe(false);
  await generateLessons(database, opts, runner, reviewer);
  expect({ generated, reviewed }).toEqual({ generated: 1, reviewed: 1 });
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'app/data/lesson-audit/825.json'), 'utf8'));
  expect(audit.review.verdict).toBe('pass');
  expect(audit.provenance.reviewer.humanReviewed).toBe(false);
});

it.each(['generation', 'final'] as const)('rejects changed %s bytes when resuming a saved success', async changed => {
  const { root, database, draft, opts, destination } = fixture();
  let generated = 0, reviewed = 0;
  const runner: Runner = async request => { generated++; return { stdout: output(request, draft), durationMs: 1, exitCode: 0 }; };
  const reviewer: Runner = async request => { reviewed++; return { stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 }; };
  await generateLessons(database, { ...opts, publish: false }, runner, reviewer);
  const report = JSON.parse(fs.readFileSync(path.join(root, '.tmp/lesson-generation/progress.json'), 'utf8'));
  const file = path.join(report.words[0].directory, changed === 'generation' ? 'generate-1/output.json' : 'reviewed.json');
  const tampered = JSON.parse(fs.readFileSync(file, 'utf8')); tampered.headline = 'Altered after review';
  fs.writeFileSync(file, JSON.stringify(tampered));
  await generateLessons(database, opts, runner, reviewer);
  expect({ generated, reviewed }).toEqual({ generated: changed === 'generation' ? 2 : 1, reviewed: 2 });
  expect(JSON.parse(fs.readFileSync(destination, 'utf8')).headline).toBe(draft.headline);
});

it('rejects a review that claims coverage using nonexistent sense ids', async () => {
  const { database, draft, opts, destination } = fixture();
  const runner: Runner = async request => ({ stdout: output(request, draft), durationMs: 1, exitCode: 0 });
  const review = { ...passingReview(draft), senseInventory: [{ sense: 'Wrong inventory', coveredBy: ['not-a-real-sense'], assessment: 'Covered.' }] };
  const reviewer: Runner = async request => ({ stdout: output(request, review), durationMs: 1, exitCode: 0 });
  await generateLessons(database, opts, runner, reviewer);
  expect(fs.existsSync(destination)).toBe(false);
});

it('never publishes a changed shared review.json as the audit for an earlier cached success', async () => {
  const { root, database, draft, opts } = fixture();
  const runner: Runner = async request => ({ stdout: output(request, draft), durationMs: 1, exitCode: 0 });
  const reviewer: Runner = async request => ({ stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 });
  await generateLessons(database, { ...opts, publish: false }, runner, reviewer);
  const report = JSON.parse(fs.readFileSync(path.join(root, '.tmp/lesson-generation/progress.json'), 'utf8'));
  fs.writeFileSync(path.join(report.words[0].directory, 'review.json'), JSON.stringify({ ...passingReview(draft), verdict: 'reject' }));
  await generateLessons(database, opts, runner, reviewer);
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'app/data/lesson-audit/825.json'), 'utf8'));
  expect(audit.review.verdict).toBe('pass');
});

it('releases the generator lock even when progress writes fail', async () => {
  const { root, database, draft, opts, destination } = fixture();
  let failProgress = false;
  const originalWrite = fs.writeFileSync;
  const spy = vi.spyOn(fs, 'writeFileSync').mockImplementation(((file: any, ...args: any[]) => {
    if (failProgress && String(file).includes('/progress.json.')) throw new Error('simulated disk write failure');
    return (originalWrite as any)(file, ...args);
  }) as typeof fs.writeFileSync);
  const runner: Runner = async request => { failProgress = true; return { stdout: output(request, draft), durationMs: 1, exitCode: 0 }; };
  const reviewer: Runner = async request => ({ stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 });
  try {
    await expect(generateLessons(database, opts, runner, reviewer)).rejects.toThrow(/disk write failure/);
  } finally { spy.mockRestore(); }
  expect(fs.existsSync(path.join(root, '.tmp/lesson-generation/generate.lock'))).toBe(false);
  expect(fs.existsSync(destination)).toBe(false);
});

it.each(['invalid', 'draft'] as const)('reports an existing %s destination instead of silently counting or replacing it', async state => {
  const { database, draft, opts, destination } = fixture();
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const before = state === 'invalid' ? 'broken JSON' : JSON.stringify(draft);
  fs.writeFileSync(destination, before);
  let calls = 0;
  const runner: Runner = async () => { calls++; throw new Error('must not call'); };
  await expect(generateLessons(database, opts, runner, runner)).rejects.toThrow();
  expect(calls).toBe(0);
  expect(fs.readFileSync(destination, 'utf8')).toBe(before);
});

it('does not publish a structurally valid lesson that exceeds the reader size limit', async () => {
  const { database, draft, opts, destination } = fixture();
  draft.memoryAid.cues = Array.from({ length: 80 }, (_, index) => ({ label: `Cue ${index}`, text: 'x'.repeat(8000) }));
  const runner: Runner = async request => ({ stdout: output(request, draft), durationMs: 1, exitCode: 0 });
  const reviewer: Runner = async request => ({ stdout: output(request, passingReview(draft)), durationMs: 1, exitCode: 0 });
  await generateLessons(database, opts, runner, reviewer);
  expect(fs.existsSync(destination)).toBe(false);
});

it.each([
  { argv: ['--real', '--words', '--publish'], expected: '--words requires a value' },
  { argv: ['--publish', 'false'], expected: '--publish takes no value' },
  { argv: ['--concurncy', '8'], expected: 'unknown option: concurncy' },
])('rejects malformed CLI options before opening a database: $argv', ({ argv, expected }) => {
  const script = fileURLToPath(new URL('../scripts/lesson-generate.ts', import.meta.url));
  const result = spawnSync(process.execPath, ['--import', 'tsx', script, ...argv], { encoding: 'utf8', timeout: 10000 });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(expected);
  expect(result.stdout).toBe('');
});
