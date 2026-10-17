/**
 * 幂等导入：词表 CSV（headword,level[,pos]）+ ECDICT 补音标/释义。
 * 用法：tsx server/src/import.ts --list data/wordlists/sample.csv --source sample [--sample] [--ecdict data/raw/ecdict.csv] [--db data/vocab.db]
 * 重复运行只更新 words 行（按 source+headword 唯一），不动 cards/复习记录。
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { openDb, type DB } from './db.ts';
import { parseCsvLine, quotesOpen } from './csv.ts';

export interface ListEntry { headword: string; level: string | null; pos: string | null }
export interface DictEntry { phonetic: string; translation: string; pos: string; frq: number }

/** 课标词条常见写法：“a (an)”、“be (am, is, are)”、“color (colour)”、“T-shirt”。取主词形查词典 */
export function lookupKey(headword: string): string {
  return headword.replace(/\(.*?\)|（.*?）/g, '').split('/')[0].trim().toLowerCase();
}

export function readList(file: string): ListEntry[] {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  const header = parseCsvLine(lines.shift()!).map((h) => h.trim());
  const hi = header.indexOf('headword'); const li = header.indexOf('level'); const pi = header.indexOf('pos');
  if (hi < 0) throw new Error('词表 CSV 缺少 headword 列');
  const seen = new Set<string>(); const out: ListEntry[] = [];
  for (const l of lines) {
    const f = parseCsvLine(l); const hw = (f[hi] ?? '').trim();
    if (!hw || seen.has(hw.toLowerCase())) continue;
    seen.add(hw.toLowerCase());
    out.push({ headword: hw, level: li >= 0 ? (f[li]?.trim() || null) : null, pos: pi >= 0 ? (f[pi]?.trim() || null) : null });
  }
  return out;
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
  if (kept.length) return { senses: kept, flag: null };
  return { senses: lines.slice(0, 1), flag: lines.length ? REVIEW_FLAG : null };
}

/** 兼容旧调用：返回过滤后的释义文本 */
export function cleanTranslation(t: string): string { return filterSenses(t).senses.join('\n'); }

/** 流式扫描 ECDICT，只保留需要的词 */
export async function loadDict(file: string, wanted: Set<string>): Promise<Map<string, DictEntry>> {
  const map = new Map<string, DictEntry>();
  const rl = readline.createInterface({ input: fs.createReadStream(file, 'utf8'), crlfDelay: Infinity });
  let buf = ''; let header: string[] | null = null;
  for await (const line of rl) {
    buf = buf ? buf + '\n' + line : line;
    if (quotesOpen(buf)) continue;
    const f = parseCsvLine(buf); buf = '';
    if (!header) { header = f; continue; }
    const key = f[0]?.toLowerCase();
    if (!key || !wanted.has(key)) continue;
    const e: DictEntry = { phonetic: f[1] ?? '', translation: f[3] ?? '', pos: f[4] ?? '', frq: Number(f[9]) || 0 };
    const prev = map.get(key);
    // 同一小写词有多条（如 May/may），优先小写原形且有释义的
    if (!prev || (!prev.translation && e.translation) || (f[0] === key && prev.translation && e.translation)) map.set(key, e);
  }
  return map;
}

export function upsertWords(db: DB, list: ListEntry[], dict: Map<string, DictEntry>, source: string, isSample: boolean) {
  const stmt = db.prepare(`INSERT INTO words(headword,phonetic,pos,meaning_zh,meaning_raw,meaning_flag,source,level,freq_rank,is_sample) VALUES (@headword,@phonetic,@pos,@meaning,@raw,@flag,@source,@level,@frq,@sample)
    ON CONFLICT(source,headword) DO UPDATE SET phonetic=excluded.phonetic,pos=excluded.pos,meaning_zh=excluded.meaning_zh,meaning_raw=excluded.meaning_raw,meaning_flag=excluded.meaning_flag,level=excluded.level,freq_rank=excluded.freq_rank,is_sample=excluded.is_sample`);
  let missingPhonetic = 0, missingMeaning = 0; const missing: string[] = []; const flagged: string[] = [];
  db.transaction(() => {
    for (const e of list) {
      const d = dict.get(lookupKey(e.headword));
      const phonetic = d?.phonetic ? `/${d.phonetic}/` : null;
      const fs_ = filterSenses(d?.translation ?? '');
      const meaning = fs_.senses.join('\n') || null;
      if (fs_.flag) flagged.push(e.headword);
      if (!phonetic) missingPhonetic++;
      if (!meaning) missingMeaning++;
      if (!phonetic || !meaning) missing.push(e.headword);
      stmt.run({ headword: e.headword, phonetic, raw: d?.translation || null, flag: fs_.flag, pos: e.pos ?? d?.pos ?? null, meaning, source, level: e.level, frq: d?.frq || null, sample: isSample ? 1 : 0 });
    }
  })();
  const total = (db.prepare('SELECT COUNT(*) n FROM words WHERE source=?').get(source) as { n: number }).n;
  const byLevel = db.prepare('SELECT level, COUNT(*) n FROM words WHERE source=? GROUP BY level').all(source);
  return { imported: list.length, totalInDb: total, byLevel, missingPhonetic, missingMeaning, missing, flagged };
}

/** 与课标转述数字（1600 / 二级 505 / 初中 1095，未验证）比对 */
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
  const a = process.argv.slice(2); const arg = (k: string, d?: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  const listFile = arg('--list'); const source = arg('--source');
  if (!listFile || !source) { console.error('需要 --list <csv> --source <名称>'); process.exit(2); }
  const db = openDb(arg('--db', process.env.DB_PATH ?? 'data/vocab.db')!);
  const list = readList(listFile);
  const dict = await loadDict(arg('--ecdict', 'data/raw/ecdict.csv')!, new Set(list.map((e) => lookupKey(e.headword))));
  const r = upsertWords(db, list, dict, source, a.includes('--sample'));
  console.log(JSON.stringify({ source, sample: a.includes('--sample'), ...r, countCheck: compareExpected(r.totalInDb, r.byLevel as any) }, null, 2));
  db.close();
}
if (process.argv[1]?.endsWith('import.ts')) main().catch((e) => { console.error(e); process.exit(1); });
