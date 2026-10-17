/** 生成 qa/ecdict-filter-sample.md：'a' + 20 个随机词（固定种子）过滤前后对比，供内容制作抽查 */
import fs from 'node:fs';
import { DROP_TAGS, filterSenses, loadDict, lookupKey, rawLines, readList } from '../server/src/import.ts';
const list = readList(process.argv[2] ?? 'data/wordlists/sample.csv');
const dict = await loadDict('data/raw/ecdict.csv', new Set(list.map((e) => lookupKey(e.headword))));
let seed = 20261017; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pool = list.filter((e) => lookupKey(e.headword) !== 'a');
const picked: typeof list = [];
while (picked.length < Math.min(20, pool.length)) { const e = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; picked.push(e); }
const rows = [list.find((e) => lookupKey(e.headword) === 'a')!, ...picked];
let md = `# ECDICT 释义过滤抽查（${new Date().toISOString().slice(0, 10)}）\n\n- 词表：${process.argv[2] ?? 'data/wordlists/sample.csv'}（**示例数据**，不是课标词表）\n- 规则：一行一个义项；删掉含以下标签的行：${DROP_TAGS.map((t) => `[${t}]`).join('')}；其余保留（含 [复][植][动][体][物]）。卡片显示前 2 条，其余在“更多释义”里。全删光时保留原始第一行并标“释义待人工看”。数据库同时保存原始 translation（meaning_raw）。\n- 抽样：'a' + 从词表中按固定种子随机抽 20 个。\n\n`;
for (const e of rows) {
  const raw = dict.get(lookupKey(e.headword))?.translation ?? '';
  const f = filterSenses(raw);
  md += `## ${e.headword}\n**原始：**\n${rawLines(raw).map((l) => `- ${l}`).join('\n') || '- （无）'}\n\n**过滤后（卡片显示前 2 条）：**${f.flag ? ` ⚠ ${f.flag}` : ''}\n${f.senses.map((l, i) => `- ${i < 2 ? '' : '（更多）'}${l}`).join('\n') || '- （无）'}\n\n`;
}
fs.mkdirSync('qa', { recursive: true }); fs.writeFileSync('qa/ecdict-filter-sample.md', md);
console.log('wrote qa/ecdict-filter-sample.md', rows.length, 'words');
