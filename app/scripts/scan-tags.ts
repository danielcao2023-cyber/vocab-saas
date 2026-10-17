import fs from 'node:fs';
import { readList, loadDict, lookupKey } from '../server/src/import.ts';
import readline from 'node:readline';
import { parseCsvLine, quotesOpen } from '../server/src/csv.ts';
const list = readList('data/wordlists/sample.csv');
const want = new Set(list.map(e => lookupKey(e.headword)));
const tagsOurs = new Map<string, number>(); const tagsAll = new Map<string, number>();
const rl = readline.createInterface({ input: fs.createReadStream('data/raw/ecdict.csv', 'utf8') });
let buf = ''; let first = true;
for await (const line of rl) { buf = buf ? buf + '\n' + line : line; if (quotesOpen(buf)) continue; const f = parseCsvLine(buf); buf = ''; if (first) { first = false; continue; }
  const t = f[3] ?? ''; for (const m of t.matchAll(/\[([^\]\s]{1,6})\]/g)) { tagsAll.set(m[1], (tagsAll.get(m[1]) ?? 0) + 1); if (want.has(f[0])) tagsOurs.set(m[1], (tagsOurs.get(m[1]) ?? 0) + 1); } }
const top = (m: Map<string, number>, n: number) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}:${v}`).join(' ');
console.log('OURS', top(tagsOurs, 50)); console.log('ALL', tagsAll.size, top(tagsAll, 60));
