/** Read-only, explainable content triage. A clean report is not a semantic approval. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { args, cli, dbArg, isMain } from '../server/src/ai/cli.ts';
import { resolved } from '../server/src/guard.ts';
import { defaultLessonDir, inspectLessonFile, validateLesson } from '../server/src/lessons.ts';
import { mainHeadwords, normalizeQuotes } from '../server/src/text.ts';
import { atomicJson, readLessonWords } from './lesson-generate.ts';
import type { WordLesson } from '../shared/lesson.ts';

type Word = ReturnType<typeof readLessonWords>[number];
type Location = { wordId: number; headword: string; path: string; excerpt?: string };
type Finding = { code: string; severity: 'invalid' | 'review' | 'info'; message: string; locations: Location[] };
type Example = Location & { en: string; template: string };
type Options = { directory?: string; auditDirectory?: string };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const excerpt = (text: string) => text.length > 240 ? text.slice(0, 237) + '…' : text;
const normalized = (text: string) => normalizeQuotes(text).normalize('NFKC').replace(/\s+/g, ' ').trim();
const sameText = (text: string) => normalized(text).toLowerCase().replace(/[.!?。！？]+$/, '');
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const location = (word: Pick<Word, 'id' | 'headword'>, field: string, text?: string): Location => ({ wordId: word.id, headword: word.headword, path: field, ...(text ? { excerpt: excerpt(text) } : {}) });

function wordForms(word: Word, lesson: WordLesson) {
  return [...new Set([...mainHeadwords(word.headword), ...word.forms.map(f => f.form), ...lesson.forms.map(f => f.form)].map(normalized).filter(Boolean))];
}
function formPattern(form: string, global = false) {
  // Lowercase words may start a sentence; uppercase lexical identities remain distinct.
  return new RegExp(`(?<![A-Za-z])${escapeRe(form).replace(/\s+/g, '\\s+')}(?![A-Za-z])`, (global ? 'g' : '') + (form === form.toLowerCase() ? 'i' : ''));
}
function sentenceTemplate(en: string, forms: string[]) {
  let value = normalized(en);
  for (const form of forms.filter(f => /[A-Za-z]{3}/.test(f)).sort((a, b) => b.length - a.length)) value = value.replace(formPattern(form, true), ' TARGETWORD ');
  return value.includes('TARGETWORD') ? value.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim() : '';
}
function studentStrings(value: unknown, field = ''): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path: field || '/', text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => studentStrings(item, `${field}/${index}`));
  if (!object(value)) return [];
  const metadata = new Set(['editorial', 'sources', 'sourceIds', 'id', 'wordId', 'senseId', 'schemaVersion', 'headword']);
  return Object.entries(value).filter(([key]) => !metadata.has(key)).flatMap(([key, item]) => studentStrings(item, `${field}/${key}`));
}
const placeholder = /\b(?:TODO|TBD|FIXME|PLACEHOLDER|lorem ipsum)\b|待(?:生成|补充|填写|完善)|稍后补(?:充|齐)|此处(?:填写|添加)|\{\{[^{}]+\}\}|<(?:WORD|HEADWORD|TODO)>/i;
const productionProse = /给定(?:的)?(?:词源)?(?:资料|材料)|所给(?:的)?(?:词源)?(?:资料|材料)|旧音标|该词源栏/;
const missingHistoricalMeaning = /(?:资料|材料|来源|词源栏).{0,24}(?:未|没有).{0,20}(?:含义|本义|意义|释义)|(?:未|没有)(?:提供|说明|注明|单列|记载).{0,20}(?:含义|本义|意义|释义)/;
const pointer = (value: unknown) => {
  if (typeof value !== 'string') return null;
  // Lesson schema keys are ASCII identifiers. Descriptions such as
  // "/senses、/confusions 中的例句" are not a single machine-comparable path.
  if (/^\/(?:[A-Za-z]\w*|\d+|-)(?:\/(?:[A-Za-z]\w*|\d+|-))*$/.test(value)) return value;
  if (/^[A-Za-z]\w*(?:\[\d+\]|\.[A-Za-z]\w*)*$/.test(value)) return '/' + value.replace(/\[(\d+)\]/g, '/$1').replace(/\./g, '/');
  return null;
};
const intersects = (a: string, b: string) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
function historicalNarrative(summary: string) {
  // A prose-only account is still historical content even when no staged chain is used.
  if (/^(?:目前|尚未|尚无|未|没有|暂无|无法|不宜|不能).{0,35}(?:可靠|确认|证据|核实|推断)/.test(summary)) return false;
  return /来自|源自|追溯|借入|同源|历史(?:上|与|来源|联系)|古英语|古法语|中古英语|拉丁语|古希腊语/.test(summary);
}

function readAudit(directory: string, id: number): unknown | null {
  const requested = path.join(directory, `${id}.json`);
  if (!fs.existsSync(requested)) return null;
  const root = fs.realpathSync(directory), file = fs.realpathSync(requested), stat = fs.statSync(file);
  if (path.dirname(file) !== root || !stat.isFile() || stat.size > 2 * 1024 * 1024) throw new Error('unsafe or oversized audit file');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Issue locations can suggest a patch addressed a concern, never prove its semantic resolution. */
function inspectAudit(audit: unknown, word: Word, lesson: WordLesson, fileHash: string, add: (code: string, severity: Finding['severity'], message: string, field: string, text?: string) => void) {
  if (audit === null) {
    add('audit-not-present', 'info', 'No audit sidecar is present; editorial status alone does not provide independently checkable review evidence.', '/editorial');
    return { status: 'not-present', issues: [], sourceEvidence: [] as any[] };
  }
  // The first edited lessons retain the original machine issues followed by a
  // separate editor's review. Do not replay or attribute those old issues to the final text.
  if (object(audit) && audit.schemaVersion === 1 && object(audit.editorialReview) && audit.editorialReview.method === 'independent Codex agent full-content read') {
    const editor = audit.editorialReview; let bound = true;
    if (audit.wordId !== word.id || audit.headword !== word.headword) { bound = false; add('audit-identity-mismatch', 'invalid', 'Editor audit identity does not match the curriculum entry.', '/audit'); }
    if (audit.lessonSha256 !== fileHash) { bound = false; add('audit-final-hash-mismatch', 'invalid', 'Editor audit final UTF-8 byte hash does not match the published file.', '/audit/lessonSha256'); }
    const passed = editor.status === 'passed' && hasText(editor.reviewer) && /^[a-f0-9]{64}$/.test(editor.candidateSha256 ?? '') && object(editor.evidence) && Object.keys(editor.evidence).length > 0;
    if (!passed) add('editor-review-unconfirmed', 'review', 'A complete passed independent-editor record is not present. Earlier machine issues must not be assumed resolved.', '/audit/editorialReview');
    if (editor.humanTeacherReviewed !== false) add('editor-teacher-label-unclear', 'review', 'A Codex editor record does not by itself establish human-teacher review.', '/audit/editorialReview/humanTeacherReviewed');
    const previous = object(audit.modelReview?.result) ? audit.modelReview.result : {};
    const issues = (Array.isArray(previous.issues) ? previous.issues : []).filter(object).map((issue: any, index: number) => ({ index, severity: issue.severity, location: issue.location, message: issue.message,
      resolution: passed && bound ? 'superseded-by-recorded-independent-editor-review' : 'earlier-model-issue-resolution-unconfirmed' }));
    return { status: !bound ? 'invalid' : passed ? 'editor-record-bound' : 'editor-review-unconfirmed', verdict: editor.status, issues,
      priorModelVerdict: previous.verdict ?? null, humanTeacherReviewed: editor.humanTeacherReviewed === true,
      candidateMatchesPublishedBytes: editor.candidateSha256 === fileHash,
      sourceEvidence: Array.isArray(audit.sourceEvidence) ? audit.sourceEvidence : [] };
  }
  if (!object(audit) || !object(audit.provenance) || !object(audit.review) || !object(audit.input)) {
    add('audit-unsupported', 'info', 'This audit format is not recognized; it is neither counted as a passed review nor declared incorrect.', '/audit');
    return { status: 'unsupported', issues: [], sourceEvidence: [] as any[] };
  }
  const { provenance: p, review: r, input } = audit; let bound = true;
  const invalid = (code: string, message: string) => { bound = false; add(code, 'invalid', message, '/audit'); };
  if (p.wordId !== word.id || input.id !== word.id || input.headword !== word.headword) invalid('audit-identity-mismatch', 'Audit identity does not match the curriculum entry.');
  if (p.finalHash !== hash(lesson)) invalid('audit-final-hash-mismatch', 'The recorded review is not bound to these lesson bytes (canonical JSON hash).');
  if (p.reviewHash !== hash(r)) invalid('audit-review-hash-mismatch', 'The recorded review hash does not match the review object.');
  if (p.inputHash !== hash(input)) invalid('audit-input-hash-mismatch', 'The recorded input hash does not match the retained input object.');
  else if (hash(input) !== hash(word)) add('audit-input-changed', 'review', 'Vocabulary metadata changed after this review; compare the original input before accepting the lesson.', '/audit/input');
  if (!['pass', 'revised'].includes(r.verdict)) invalid('audit-nonpassing-verdict', `Review verdict is ${String(r.verdict)}.`);
  const patches = Array.isArray(r.patches) ? r.patches : [];
  if (!Array.isArray(r.patches) || r.verdict === 'pass' && patches.length || r.verdict === 'revised' && !patches.length) invalid('audit-inconsistent-patches', 'Review verdict and retained patches are inconsistent.');
  const senseIds = new Set([...lesson.senses, ...lesson.lessCommonSenses].map(s => s.id)), covered = new Set<string>();
  if (!Array.isArray(r.senseInventory) || !r.senseInventory.length) invalid('audit-sense-inventory-missing', 'Review has no sense inventory.');
  else for (const item of r.senseInventory) {
    if (!object(item) || !Array.isArray(item.coveredBy) || item.coveredBy.some(id => !senseIds.has(id))) invalid('audit-sense-reference-invalid', 'Review inventory references an unknown sense.');
    else item.coveredBy.forEach(id => covered.add(id));
  }
  if (lesson.senses.some(s => !covered.has(s.id))) invalid('audit-core-sense-uncovered', 'The retained review inventory omits a core sense.');
  if (!Array.isArray(r.issues)) invalid('audit-issues-invalid', 'The review issue list is malformed.');
  const issues = (Array.isArray(r.issues) ? r.issues : []).map((issue: any, index: number) => {
    if (!object(issue) || !['error', 'polish', 'uncertainty'].includes(issue.severity) || !hasText(issue.message)) {
      invalid('audit-issue-invalid', 'A review issue has no valid severity or message.'); return { index, resolution: 'unreadable' };
    }
    const field = pointer(issue.location), candidatePatches = patches.filter((patch: any) => object(patch) && field && pointer(patch.path) && intersects(field, patch.path));
    const resolution = r.verdict === 'revised' && candidatePatches.length ? 'patch-addressed-not-semantically-verified' : !field ? 'manual-issue-to-patch-link-required' : 'unresolved-or-unlinked';
    if (issue.severity === 'error' && r.verdict === 'pass') {
      bound = false; add('review-error-unresolved', 'invalid', 'The audit says pass while retaining a substantive error and no revision. Review this inconsistent record.', `/audit/review/issues/${index}`, issue.message);
    } else if (issue.severity === 'error' && resolution !== 'patch-addressed-not-semantically-verified') {
      add(!field ? 'review-issue-link-unverified' : 'review-error-unresolved', 'review', !field
        ? 'This issue uses a descriptive or compound location. Its connection to the retained patches requires manual review; this is not evidence that the published text still has the error.'
        : 'No retained patch path overlaps this issue location. Check whether it was corrected elsewhere; the location comparison alone cannot establish that the error remains.', `/audit/review/issues/${index}`, issue.message);
    }
    if (issue.severity === 'uncertainty') add('review-uncertainty', 'review', 'The reviewer recorded uncertainty. A patch alone does not establish that the underlying claim is now verified.', `/audit/review/issues/${index}`, issue.message);
    return { index, severity: issue.severity, location: issue.location, message: issue.message, resolution, candidatePatchPaths: candidatePatches.map((patch: any) => patch.path) };
  });
  return { status: bound ? 'pipeline-bound' : 'invalid', verdict: r.verdict, issues, sourceEvidence: Array.isArray(p.sourceEvidence) ? p.sourceEvidence : [] };
}

function emptyTotals() {
  return { lessons: 0, coreSenses: 0, coreExamples: 0, sensesWithTwoExamples: 0, patterns: 0, collocations: 0, sensesWithTwoUsages: 0,
    similarEntries: 0, sensesWithSimilarEntries: 0, sensesWithSimilarExplanation: 0, contrastingEntries: 0, sensesWithContrastingEntries: 0, sensesWithContrastingExplanation: 0,
    historicalStages: 0, historyClaimLessons: 0, historyNarrativeOnly: 0, historyWithRetrievalRecord: 0, historyWithDeclaredVerifiedReference: 0, historyReferenceOnly: 0,
    wordFamilyEntries: 0, wordFamilyEntriesWithSourceRefs: 0, lessonsWithWordFamily: 0, lessonsWithWordFamilyExplanation: 0, memoryStories: 0, memoryCues: 0 };
}

export function lessonQuality(database: string, opts: Options = {}) {
  const startedAt = new Date().toISOString(), directory = opts.directory ?? defaultLessonDir;
  const auditDirectory = opts.auditDirectory ?? path.join(path.dirname(directory), 'lesson-audit');
  const words = readLessonWords(database), findings: Finding[] = [], examples: Example[] = [], memories = new Map<string, Location[]>();
  const counts = { reviewed: 0, draft: 0, invalid: 0, missing: 0 }, coverage = { reviewed: emptyTotals(), draft: emptyTotals() };
  const known = new Set(words.flatMap(word => mainHeadwords(word.headword)));
  const rows = words.map(word => {
    const add = (code: string, severity: Finding['severity'], message: string, field: string, text?: string) => findings.push({ code, severity, message, locations: [location(word, field, text)] });
    if (!fs.existsSync(path.join(directory, `${word.id}.json`))) { counts.missing++; return { id: word.id, headword: word.headword, status: 'missing' }; }
    let lesson: WordLesson, fileHash: string;
    try {
      const { file } = inspectLessonFile(directory, word.id), raw = fs.readFileSync(file, 'utf8'), value = JSON.parse(raw), validation = validateLesson(value, word);
      if (!validation.ok) throw new Error(validation.errors.join('; '));
      lesson = validation.lesson; fileHash = createHash('sha256').update(raw).digest('hex');
    } catch (error) {
      counts.invalid++; add('lesson-invalid', 'invalid', 'This file cannot be served as a matching lesson; content metrics exclude it.', '/', error instanceof Error ? error.message : 'unreadable file');
      return { id: word.id, headword: word.headword, status: 'invalid' };
    }
    counts[lesson.editorial.status]++; const total = coverage[lesson.editorial.status]; total.lessons++;
    let audit: ReturnType<typeof inspectAudit>;
    try { audit = inspectAudit(readAudit(auditDirectory, word.id), word, lesson, fileHash, add); }
    catch { add('audit-unreadable', 'invalid', 'The audit cannot be safely read.', '/audit'); audit = { status: 'invalid', issues: [], sourceEvidence: [] }; }
    const forms = wordForms(word, lesson), cores = lesson.senses.flatMap((sense, index) => sense.examples.map((ex, i) => ({ ...location(word, `/senses/${index}/examples/${i}/en`, ex.en), en: ex.en, template: sentenceTemplate(ex.en, forms) })));
    examples.push(...cores);
    if (cores.length && !cores.some(ex => forms.some(form => formPattern(form).test(normalized(ex.en))))) add('core-examples-missing-target', 'review', 'None of the core examples contains a known target form. Check for another word’s examples or incomplete inflection metadata.', '/senses', cores.slice(0, 2).map(ex => ex.en).join(' | '));
    for (const field of studentStrings(lesson)) {
      if (placeholder.test(field.text)) add('student-placeholder', 'review', 'Possible unfinished placeholder in student-facing prose.', field.path, field.text);
      if (productionProse.test(field.text)) add('student-production-prose', 'review', 'Student-facing prose refers to source handoff or data migration. Replace editorial wording with useful teaching, after resolving any real evidence gap.', field.path, field.text);
    }
    lesson.etymology.stages.forEach((stage, index) => {
      if (missingHistoricalMeaning.test(stage.meaning)) add('historical-form-meaning-gap', 'review', 'A historical form is listed without an explained meaning. Seek relevant evidence; do not invent a meaning or count this stage as fully explained.', `/etymology/stages/${index}/meaning`, stage.meaning);
    });
    for (const [field, text] of [['/headline', lesson.headline], ['/takeaway', lesson.takeaway], ['/memoryAid/story', lesson.memoryAid.story]]) {
      for (const match of text.matchAll(/(?:本词(?:是|为)?|今天(?:我们)?(?:要)?学习的(?:单词)?(?:是|为)|这个单词(?:是|为))[：:\s“"'「『]*([A-Za-z][A-Za-z’'-]*)/g)) {
        if (known.has(match[1]) && !forms.includes(match[1])) add('declared-other-headword', 'review', 'Student prose explicitly names another curriculum word as the current word.', field, text);
      }
    }
    const story = sameText(lesson.memoryAid.story), memoryLocations = memories.get(story) ?? [];
    memoryLocations.push(location(word, '/memoryAid/story', lesson.memoryAid.story)); memories.set(story, memoryLocations);
    const senses = lesson.senses.map(sense => {
      total.coreSenses++; total.coreExamples += sense.examples.length; total.sensesWithTwoExamples += Number(sense.examples.length >= 2);
      total.patterns += sense.patterns.length; total.collocations += sense.collocations.length; total.sensesWithTwoUsages += Number(sense.patterns.length + sense.collocations.length >= 2);
      const relation = (key: 'similar' | 'contrasting') => sense.relatedExpressions[key].length ? 'entries' : hasText(sense.relatedExpressions[`${key}Note`]) ? 'explained-empty' : 'missing';
      const similar = relation('similar'), contrasting = relation('contrasting');
      total.similarEntries += sense.relatedExpressions.similar.length; total.sensesWithSimilarEntries += Number(similar === 'entries'); total.sensesWithSimilarExplanation += Number(similar === 'explained-empty');
      total.contrastingEntries += sense.relatedExpressions.contrasting.length; total.sensesWithContrastingEntries += Number(contrasting === 'entries'); total.sensesWithContrastingExplanation += Number(contrasting === 'explained-empty');
      return { id: sense.id, title: sense.title, examples: sense.examples.length, patterns: sense.patterns.length, collocations: sense.collocations.length, similar, contrasting };
    });
    const historicalSources = lesson.sources.filter(source => lesson.etymology.sourceIds.includes(source.id));
    const retrieved = ['pipeline-bound', 'editor-record-bound'].includes(audit.status) && historicalSources.some(source => audit.sourceEvidence.some(e => object(e) && e.kind === 'etymology' && e.status === 'retrieved' && e.url === source.url));
    const declared = historicalSources.some(source => source.verification === 'verified');
    const narrativeSignal = historicalNarrative(lesson.etymology.summary), historyClaim = !!lesson.etymology.stages.length || narrativeSignal;
    const historyEvidence = !historyClaim ? 'not-claimed' : retrieved ? 'retrieval-record' : declared ? 'declared-verified-reference' : historicalSources.length ? 'reference-only' : 'none';
    total.historicalStages += lesson.etymology.stages.length; total.historyClaimLessons += Number(historyClaim); total.historyNarrativeOnly += Number(narrativeSignal && !lesson.etymology.stages.length);
    total.historyWithRetrievalRecord += Number(historyEvidence === 'retrieval-record'); total.historyWithDeclaredVerifiedReference += Number(historyEvidence === 'declared-verified-reference'); total.historyReferenceOnly += Number(['reference-only', 'none'].includes(historyEvidence));
    if (['reference-only', 'none'].includes(historyEvidence)) add('historical-claim-evidence-gap', 'review', 'Historical stages or historical wording appear without a matching retrieval record or declared verified source reference. Check both the wording and its source.', '/etymology', lesson.etymology.summary);
    total.wordFamilyEntries += lesson.wordFamily.length; total.wordFamilyEntriesWithSourceRefs += lesson.wordFamily.filter(member => member.sourceIds.length).length; total.lessonsWithWordFamily += Number(!!lesson.wordFamily.length); total.lessonsWithWordFamilyExplanation += Number(!lesson.wordFamily.length && hasText(lesson.wordFamilyNote));
    total.memoryStories += Number(hasText(lesson.memoryAid.story)); total.memoryCues += lesson.memoryAid.cues.length;
    return { id: word.id, headword: word.headword, status: lesson.editorial.status, fileSha256: fileHash, senses, lessCommonSenses: lesson.lessCommonSenses.length,
      history: { stages: lesson.etymology.stages.length, narrativeSignal, evidence: historyEvidence, sourceUrls: historicalSources.map(source => source.url) },
      wordFamily: { entries: lesson.wordFamily.length, explainedEmpty: !lesson.wordFamily.length && hasText(lesson.wordFamilyNote) }, memoryCues: lesson.memoryAid.cues.length,
      audit: { status: audit.status, verdict: 'verdict' in audit ? audit.verdict : null, issues: audit.issues,
        ...('priorModelVerdict' in audit ? { priorModelVerdict: audit.priorModelVerdict, humanTeacherReviewed: audit.humanTeacherReviewed, candidateMatchesPublishedBytes: audit.candidateMatchesPublishedBytes } : {}) } };
  });
  for (const locations of memories.values()) if (locations.length > 1) findings.push({ code: 'repeated-memory-story', severity: 'review', message: 'Different words share the same normalized memory story. Check whether a generic template replaced word-specific content.', locations });
  const exact = new Map<string, Example[]>(), templates = new Map<string, Example[]>();
  const appendExample = (map: Map<string, Example[]>, key: string, example: Example) => { const group = map.get(key) ?? []; group.push(example); map.set(key, group); };
  for (const example of examples) {
    const key = sameText(example.en); if ((key.match(/[a-z]+/g) ?? []).length >= 5) appendExample(exact, key, example);
    if (example.template.split(' ').length >= 8) appendExample(templates, example.template, example);
  }
  for (const group of exact.values()) if (group.length > 1) findings.push({ code: 'repeated-core-example', severity: 'review', message: 'Core examples repeat the same normalized English sentence. Reuse may be intentional; inspect the sense assignments.', locations: group.map(({ en: _en, template: _template, ...item }) => item) });
  for (const group of templates.values()) if (new Set(group.map(item => item.wordId)).size >= 3 && new Set(group.map(item => sameText(item.en))).size >= 2) findings.push({ code: 'target-swapped-sentence-template', severity: 'review', message: 'At least three words share an 8+ token sentence after replacing known target forms. This is a mechanical-repetition signal, not a linguistic verdict.', locations: group.map(({ en: _en, template: _template, ...item }) => item) });
  return { format: 'vocab-lesson-quality-triage', version: 1, startedAt, finishedAt: new Date().toISOString(), totalCurriculumWords: words.length, expectedTotal: 1600, counts,
    fullCurriculumFilesReviewed: words.length === 1600 && counts.reviewed === 1600, semanticAcceptance: 'not-determined-by-rule-report', coverage,
    findingCounts: findings.reduce((result, finding) => { result[finding.severity]++; return result; }, { invalid: 0, review: 0, info: 0 }), findings, words: rows,
    limitations: ['Coverage counts describe supplied material, not correctness or completeness of all real meanings.', 'Empty relations/families with an explanation are counted as covered; their explanations may still require a language expert.', 'Retrieval and verified-source labels establish retained provenance only; this report does not read source pages or verify historical claims.', 'A patch touching an issue location does not prove a semantic correction. Published sidecars do not contain the original draft, so complete patch replay is not claimed.', 'Independent editor records bind the final published byte hash and retain earlier machine issues as historical. Candidate hashes may differ after publication metadata changes; this report does not reconstruct candidate-to-final transformations or claim teacher review.', 'Repetition detection is lexical: exact normalized stories/sentences and target-swapped templates. Short common sentences and semantic paraphrases can be missed; legitimate reuse can be flagged.', 'Reads only vocabulary metadata and local content/audits; no learner tables, model calls or database writes. Concurrent publication can produce a transient missing audit or hash mismatch; rerun after the writer finishes.'] };
}

if (isMain(import.meta.url)) cli(() => {
  const a = args(), allowed = new Set(['db', 'directory', 'audit-directory', 'out']);
  for (const [key, value] of Object.entries(a)) if (!allowed.has(key) || typeof value !== 'string' || !value.trim()) throw new Error(`invalid option --${key}`);
  const database = dbArg(a), directory = typeof a.directory === 'string' ? a.directory : defaultLessonDir;
  const auditDirectory = typeof a['audit-directory'] === 'string' ? a['audit-directory'] : path.join(path.dirname(directory), 'lesson-audit');
  if (typeof a.out === 'string') {
    const output = resolved(a.out);
    if (!output.endsWith('.json') || output === resolved(database) || [directory, auditDirectory].some(dir => output === resolved(dir) || output.startsWith(resolved(dir) + path.sep))) throw new Error('--out must be a JSON report outside the input database, lessons and audit directories');
  }
  const report = lessonQuality(database, { directory, auditDirectory });
  if (typeof a.out === 'string') { atomicJson(a.out, report); return { totalCurriculumWords: report.totalCurriculumWords, counts: report.counts, findingCounts: report.findingCounts, semanticAcceptance: report.semanticAcceptance, report: a.out }; }
  return report;
});
