import {KB2022_TEXTBOOK_CORRECTIONS} from './kb2022-textbook-corrections.ts';
/**
 * 幂等导入：先校验输入，再事务内更新 words，不动正式词的 cards/复习记录。
 * 课标：npm run import -- --curriculum ../data/curriculum/ocr/level3_list.tsv
 *   --level2 ../data/curriculum/ocr/level2_list.tsv --manual ../v2/manual_meanings.tsv --source kb2022
 *   [--ecdict data/raw/ecdict.csv] [--db data/vocab.db] [--clear-sample] [--dry-run]
 * 旧 CSV：npm run import -- --list data/wordlists/sample.csv --source sample [--sample]
 * --level2 交叉核对二级集合；--manual 显式指定人工释义，不自动读取；--sample 仅用于 CSV。
 * --clear-sample 同事务删除 is_sample=1 的词及关联记录；--dry-run 在内存副本执行，目标文件不变。
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { openDb, type DB } from './db.ts';
import { checkBackupPath, productionGate, verifiedBackup } from './guard.ts';
import { parseCsvLine, quotesOpen } from './csv.ts';
import { mainHeadwords, normalizeQuotes } from './text.ts';

export interface ListEntry { headword: string; level: string | null; pos: string | null; entry_raw?: string; priority?: number }
export interface CurriculumEntry extends ListEntry { entry_raw: string; level: '二级' | '三级'; priority: 1 | 2 }
export interface DictEntry { phonetic: string; translation: string; pos: string; frq: number; bnc?: number }

/** 保留大小写：ECDICT 原样匹配优先。 */
export function lookupKey(headword: string): string { return mainHeadwords(headword)[0] ?? ''; }

export function resolveEcdictKey(head: string, dict: ReadonlyMap<string, DictEntry>): string | null {
  const key = lookupKey(head);
  if (dict.has(key)) return key;
  const lower = key.toLowerCase();
  if (dict.has(lower)) return lower;
  for (const candidate of dict.keys()) if (candidate.toLowerCase() === lower) return candidate;
  return null;
}

export function readList(file: string): ListEntry[] {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  const header = parseCsvLine(lines.shift() ?? '').map((h) => h.trim());
  const hi = header.indexOf('headword'); const li = header.indexOf('level'); const pi = header.indexOf('pos');
  if (hi < 0) throw new Error('词表 CSV 缺少 headword 列');
  const seen = new Set<string>(); const out: ListEntry[] = [];
  for (const l of lines) {
    const f = parseCsvLine(l); const raw = (f[hi] ?? '').trim(); const hw = normalizeQuotes(raw);
    if (!hw || seen.has(hw)) continue;
    seen.add(hw);
    out.push({ headword: hw, entry_raw: raw, level: li >= 0 ? (f[li]?.trim() || null) : null, pos: pi >= 0 ? (f[pi]?.trim() || null) : null });
  }
  return out;
}

function readTsv(file: string, required: string[]) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  const header = (lines.shift() ?? '').split('\t');
  const missing = required.filter((name) => !header.includes(name));
  if (missing.length) throw new Error(`${file}: 缺少列 ${missing.join(', ')}`);
  return lines.flatMap((line, i) => {
    if (!line.trim()) return [];
    const fields = line.split('\t');
    return [{ line: i + 2, fields: Object.fromEntries(header.map((name, j) => [name, fields[j] ?? ''])) }];
  });
}

function curriculumRows(file: string): CurriculumEntry[] {
  const errors: string[] = []; const seen = new Map<string, number>(); const entries: CurriculumEntry[] = [];
  for (const { line, fields } of readTsv(file, ['entry', 'level2_star'])) {
    const headword = normalizeQuotes(fields.entry.trim());
    if (!headword) errors.push(`${file}:${line}: entry 为空`);
    if (seen.has(headword)) errors.push(`${file}:${line}: entry 重复 ${headword}（首次在第 ${seen.get(headword)} 行）`);
    seen.set(headword, line);
    const star = fields.level2_star.trim();
    if (star !== '0' && star !== '1') errors.push(`${file}:${line}: level2_star 必须是 0 或 1`);
    entries.push({ headword, entry_raw: fields.entry, pos: null, level: star === '1' ? '二级' : '三级', priority: star === '1' ? 1 : 2 });
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return entries;
}

export function readCurriculum(file: string, level2File?: string): CurriculumEntry[] {
  const entries = curriculumRows(file);
  if (level2File) {
    const expected = new Set(entries.filter((entry) => entry.priority === 1).map((entry) => entry.headword));
    const actual = new Set(curriculumRows(level2File).map((entry) => entry.headword));
    const missing = [...expected].filter((entry) => !actual.has(entry));
    const extra = [...actual].filter((entry) => !expected.has(entry));
    if (missing.length || extra.length) throw new Error(`二级词表交叉核对失败：缺少 ${JSON.stringify(missing)}；多出 ${JSON.stringify(extra)}`);
  }
  return entries;
}

/** 完整校验后才返回，所有错误行一起报告；不读任何默认人工释义文件。 */
export function readManualMeanings(file: string, curriculumEntries: Iterable<string | ListEntry>): Map<string, string> {
  const entries = new Set([...curriculumEntries].map((entry) => normalizeQuotes(typeof entry === 'string' ? entry : entry.headword)));
  const meanings = new Map<string, string>(); const seen = new Map<string, number>(); const errors: string[] = [];
  for (const { line, fields } of readTsv(file, ['entry', 'manual_meaning'])) {
    const entry = normalizeQuotes(fields.entry.trim());
    const meaning = fields.manual_meaning.replace(/\\n/g, '\n').trim();
    if (!entries.has(entry)) errors.push(`${file}:${line}: entry 不在课标词表里：${entry}`);
    if (seen.has(entry)) errors.push(`${file}:${line}: entry 重复：${entry}（首次在第 ${seen.get(entry)} 行）`);
    if (!meaning) errors.push(`${file}:${line}: ${entry} 释义为空`);
    seen.set(entry, line); meanings.set(entry, meaning);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return meanings;
}

/** 领域研究定的过滤规则：含这些标签的行整行删掉；[复][植][动][体][物] 等保留 */
export const DROP_TAGS = ['医', '化', '计', '网络', '经', '法', '电', '机', '建', '人名', '地名', '药', '矿', '生化', '地质', '解', '症', '美国', '英国', '德国', '法国'];
export const REVIEW_FLAG = '释义待人工看';

export function rawLines(t: string): string[] {
  return t.replace(/\\r/g, '').replace(/\r/g, '').split(/\\n|\n/).map((s) => s.trim()).filter(Boolean);
}

/** 一行一个义项；删掉含 DROP_TAGS 标签的行；全删光则保留原始第一行并标记待人工看 */
export function filterSenses(t: string): { senses: string[]; flag: string | null } {
  const lines = rawLines(t);
  const kept = lines.filter((l) => ![...l.matchAll(/\[([^\]]+)\]/g)].some((m) => DROP_TAGS.includes(m[1])));
  const fix = (l: string) => l.replace(/^a\.(?=\s|$)/, 'adj.');
  if (kept.length) return { senses: kept.map(fix), flag: null };
  return { senses: lines.slice(0, 1), flag: lines.length ? REVIEW_FLAG : null };
}

/** 兼容旧调用：返回过滤后的释义文本 */
export function cleanTranslation(t: string): string { return filterSenses(t).senses.join('\n'); }

/** 流式扫描 ECDICT，保留需要的词的所有大小写变体以及文件顺序。 */
export async function loadDict(file: string, wanted: Set<string>): Promise<Map<string, DictEntry>> {
  const map = new Map<string, DictEntry>();
  const lowerWanted = new Set([...wanted].map((key) => lookupKey(key).toLowerCase()));
  const rl = readline.createInterface({ input: fs.createReadStream(file, 'utf8'), crlfDelay: Infinity });
  let buf = ''; let header: string[] | null = null;
  for await (const line of rl) {
    buf = buf ? buf + '\n' + line : line;
    if (quotesOpen(buf)) continue;
    const f = parseCsvLine(buf); buf = '';
    if (!header) { header = f; continue; }
    const key = f[0];
    if (!key || !lowerWanted.has(key.toLowerCase()) || map.has(key)) continue;
    map.set(key, { phonetic: f[1] ?? '', translation: f[3] ?? '', pos: f[4] ?? '', bnc: Number(f[8]) || 0, frq: Number(f[9]) || 0 });
  }
  return map;
}

const WORD_COLUMNS = ['headword', 'phonetic', 'pos', 'meaning_zh', 'meaning_raw', 'meaning_flag', 'meaning_source', 'ecdict_key', 'entry_raw', 'source', 'level', 'priority', 'freq_rank', 'is_sample'] as const;
type WordValues = Record<typeof WORD_COLUMNS[number], string | number | null>;

function applyWords(db: DB, list: ListEntry[], dict: ReadonlyMap<string, DictEntry>, source: string, isSample: boolean, manual: ReadonlyMap<string, string> = new Map()) {
  const stmt = db.prepare(`INSERT INTO words(${WORD_COLUMNS.join(',')}) VALUES (${WORD_COLUMNS.map((col) => '@' + col).join(',')})
    ON CONFLICT(source,headword) DO UPDATE SET ${WORD_COLUMNS.filter((col) => col !== 'source' && col !== 'headword').map((col) => `${col}=excluded.${col}`).join(',')}`);
  const find = db.prepare('SELECT * FROM words WHERE source=? AND headword=?');
  let inserted = 0, updated = 0, unchanged = 0, manualApplied = 0;
  const missingPhoneticWords: string[] = [], missingMeaningWords: string[] = [], flaggedWords: string[] = [], missingEcdict: string[] = [];
  const caseInsensitiveHits: { headword: string; ecdict_key: string }[] = [];
  for (const entry of list) {
    const headword = normalizeQuotes(entry.headword);
    const key = resolveEcdictKey(headword, dict);
    const d = key === null ? undefined : dict.get(key);
    const manualMeaning = manual.get(headword);
    const filtered = filterSenses(d?.translation ?? '');
    const values: WordValues = {
      headword, phonetic: d?.phonetic ? `/${d.phonetic}/` : null, pos: entry.pos ?? d?.pos ?? null,
      meaning_zh: manualMeaning ?? (filtered.senses.join('\n') || null), meaning_raw: d?.translation || null,
      meaning_flag: manualMeaning !== undefined ? null : filtered.flag,
      meaning_source: manualMeaning !== undefined ? 'manual' : 'ecdict', ecdict_key: key,
      entry_raw: entry.entry_raw ?? entry.headword, source, level: entry.level, priority: entry.priority ?? 0,
      freq_rank: d?.frq || d?.bnc || null, is_sample: isSample ? 1 : 0,
    };
    if (manualMeaning !== undefined) manualApplied++;
    if (values.meaning_flag) flaggedWords.push(headword);
    if (!values.phonetic) missingPhoneticWords.push(headword);
    if (!values.meaning_zh) missingMeaningWords.push(headword);
    if (key === null) missingEcdict.push(headword);
    else if (key !== lookupKey(headword)) caseInsensitiveHits.push({ headword, ecdict_key: key });
    const old = find.get(source, headword) as WordValues | undefined;
    // Explicit manual input is authoritative; otherwise protect prior human
    // meanings and review flags when refreshing the curriculum dictionary.
    if(source==='kb2022' && old && manualMeaning===undefined && (old.meaning_source==='manual'||old.meaning_flag!==null)){
      values.meaning_zh=old.meaning_zh; values.meaning_source=old.meaning_source; values.meaning_flag=old.meaning_flag;
    }
    const correction=source==='kb2022'?KB2022_TEXTBOOK_CORRECTIONS[headword]:undefined;
    if(old && correction && manualMeaning===undefined && old.meaning_source==='教材校订' && old.meaning_flag===null && old.meaning_zh===correction.meaning){
      values.meaning_zh=old.meaning_zh; values.meaning_source=old.meaning_source; values.meaning_flag=old.meaning_flag;
    }
    if (!old) { stmt.run(values); inserted++; }
    else if (WORD_COLUMNS.some((col) => old[col] !== values[col])) { stmt.run(values); updated++; }
    else unchanged++;
  }
  return { inserted, updated, unchanged, manualApplied, flagged: flaggedWords.length, flaggedWords,
    missingPhonetic: missingPhoneticWords.length, missingPhoneticWords, missingMeaning: missingMeaningWords.length, missingMeaningWords, missingEcdict, caseInsensitiveHits };
}

const emptyCleanup = () => ({ words: 0, cards: 0, review_logs: 0, wrong_words: 0, word_content: 0, content_feedback: 0, ai_cache: 0 });
function clearSamples(db: DB) {
  const deleted = emptyCleanup();
  db.prepare("DELETE FROM learning_v3_snapshots WHERE json_extract(body_json,'$.word_id') IN (SELECT id FROM words WHERE is_sample=1)").run();
  deleted.review_logs = db.prepare('DELETE FROM review_logs WHERE card_id IN (SELECT c.id FROM cards c JOIN words w ON w.id=c.word_id WHERE w.is_sample=1)').run().changes;
  for (const table of ['cards', 'wrong_words', 'word_content', 'content_feedback', 'ai_cache'] as const) {
    deleted[table] = db.prepare(`DELETE FROM ${table} WHERE word_id IN (SELECT id FROM words WHERE is_sample=1)`).run().changes;
  }
  for (const table of ['learning_issues','learning_day_words','learning_words']) {
    db.prepare(`DELETE FROM ${table} WHERE word_id IN (SELECT id FROM words WHERE is_sample=1)`).run();
  }
  db.prepare('DELETE FROM learning_days WHERE day NOT IN (SELECT day FROM learning_day_words)').run();
  deleted.words = db.prepare('DELETE FROM words WHERE is_sample=1').run().changes;
  return deleted;
}

interface ImportOptions { clearSample?: boolean; dryRun?: boolean }
export interface CurriculumOptions extends ImportOptions {
  manual?: ReadonlyMap<string, string>;
  expected?: { total: number; level2: number; level3: number };
}

export function upsertCurriculum(db: DB, list: CurriculumEntry[], dict: ReadonlyMap<string, DictEntry>, source: string, options: CurriculumOptions = {}) {
  const expected = options.expected ?? { total: 1600, level2: 505, level3: 1095 };
  return db.transaction(() => {
    const clearSample = options.clearSample ? clearSamples(db) : emptyCleanup();
    const result = applyWords(db, list, dict, source, false, options.manual);
    const counts = db.prepare(`SELECT COUNT(*) total,
      COALESCE(SUM(level='二级'),0) AS 二级, COALESCE(SUM(level='三级'),0) AS 三级 FROM words WHERE source=?`).get(source) as { total: number; 二级: number; 三级: number };
    const current = new Set(list.map((entry) => normalizeQuotes(entry.headword)));
    const staleRows = (db.prepare('SELECT id,headword,level FROM words WHERE source=? ORDER BY id').all(source) as { id: number; headword: string; level: string | null }[]).filter((entry) => !current.has(entry.headword));
    if (counts.total !== expected.total || counts.二级 !== expected.level2 || counts.三级 !== expected.level3) {
      throw new Error(`课标计数核对失败：${JSON.stringify(counts)}；预期 ${JSON.stringify(expected)}；staleRows=${JSON.stringify(staleRows)}`);
    }
    return { source, ...result, ...counts, clearSample, staleRows, dryRun: !!options.dryRun };
  })();
}

/** 保留旧 CSV 调用和统计字段；所有其他来源的 priority 默认 0。 */
export function upsertWords(db: DB, list: ListEntry[], dict: Map<string, DictEntry>, source: string, isSample: boolean, options: ImportOptions = {}) {
  return db.transaction(() => {
    const clearSample = options.clearSample ? clearSamples(db) : emptyCleanup();
    const result = applyWords(db, list, dict, source, isSample);
    const total = (db.prepare('SELECT COUNT(*) n FROM words WHERE source=?').get(source) as { n: number }).n;
    const byLevel = db.prepare('SELECT level, COUNT(*) n FROM words WHERE source=? GROUP BY level').all(source);
    const missing = list.map((entry) => entry.headword).filter((headword) => result.missingPhoneticWords.includes(headword) || result.missingMeaningWords.includes(headword));
    return { ...result, flagged: result.flaggedWords, imported: list.length, totalInDb: total, byLevel, missing, clearSample, dryRun: !!options.dryRun };
  })();
}

/** 旧 CSV 路径的计数提醒；课标路径使用事务内的严格核对。 */
export function compareExpected(total: number, byLevel: { level: string | null; n: number }[]) {
  const exp = { total: 1600, level2: 505, junior: 1095 };
  const lv2 = byLevel.find((x) => x.level === '二级')?.n ?? 0;
  const jr = byLevel.filter((x) => x.level && x.level !== '二级').reduce((a, x) => a + x.n, 0);
  const warnings: string[] = [];
  if (total !== exp.total) warnings.push(`总数 ${total} ≠ 1600（1600 为二手转述，未验证）`);
  if (lv2 !== exp.level2) warnings.push(`二级 ${lv2} ≠ 505`);
  if (jr !== exp.junior) warnings.push(`初中 ${jr} ≠ 1095`);
  return warnings;
}

async function main() {
  const a = process.argv.slice(2);
  const valueOptions = new Set(['--list', '--curriculum', '--level2', '--manual', '--source', '--ecdict', '--db', '--backup']);
  const switches = new Set(['--sample', '--clear-sample', '--dry-run', '--allow-production']);
  const values = new Map<string, string>(); const flags = new Set<string>();
  for (let i = 0; i < a.length; i++) {
    const option = a[i];
    if (switches.has(option)) flags.add(option);
    else if (valueOptions.has(option) && a[i + 1] && !a[i + 1].startsWith('--')) values.set(option, a[++i]);
    else throw new Error(`未知选项或缺少参数：${option}`);
  }
  const curriculum = values.get('--curriculum'); const listFile = values.get('--list'); const source = values.get('--source');
  if ((!curriculum && !listFile) || (curriculum && listFile) || !source) throw new Error('需要 --curriculum <tsv> 或 --list <csv>（二选一），以及 --source <名称>');
  if (!curriculum && (values.has('--level2') || values.has('--manual'))) throw new Error('--level2 和 --manual 需要 --curriculum');
  if (curriculum && flags.has('--sample')) throw new Error('--sample 仅用于旧 CSV 路径');
  // 正式库保护在读任何输入、碰任何库之前：$HOME/apps 下（realpath）默认拒绝；放行要 --allow-production 和 --backup。
  const dbFile = values.get('--db') ?? process.env.DB_PATH ?? 'data/vocab.db';
  const dryRun = flags.has('--dry-run');
  if (dryRun && values.has('--backup')) throw new Error('--dry-run 不写任何文件，不能和 --backup 一起用');
  const gate = productionGate(dbFile, { allowProduction: flags.has('--allow-production'), backup: values.get('--backup'), dryRun });
  const backup = gate.backup ?? (values.has('--backup') ? checkBackupPath(dbFile, values.get('--backup')!) : undefined);
  // 所有输入校验和词典读取完成后才接触数据库，失败时连迁移也不执行。
  const list = curriculum ? readCurriculum(curriculum, values.get('--level2')) : readList(listFile!);
  const manual = values.has('--manual') ? readManualMeanings(values.get('--manual')!, list) : new Map<string, string>();
  const dict = await loadDict(values.get('--ecdict') ?? 'data/raw/ecdict.csv', new Set(list.map((entry) => lookupKey(entry.headword))));
  const options = { clearSample: flags.has('--clear-sample'), dryRun };
  if (backup) { if (!fs.existsSync(dbFile)) throw new Error(`${dbFile} 不存在，无法备份`); console.error(JSON.stringify({ backup: await verifiedBackup(dbFile, backup) })); }
  const db = openDb(dbFile, options);
  try {
    const result = curriculum
      ? upsertCurriculum(db, list as CurriculumEntry[], dict, source, { ...options, manual })
      : upsertWords(db, list, dict, source, flags.has('--sample'), options);
    console.log(JSON.stringify({ source, ...result }, null, 2));
  } finally { db.close(); }
}
if (process.argv[1]?.endsWith('import.ts')) main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
