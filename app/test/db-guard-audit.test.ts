// D8：所有接受库路径的脚本/入口，在打开库（openDb / new Database）之前必须先过正式库保护。
// 静态检查：新增脚本如果接受 --db 却没接保护，这里会失败。动态拒绝见 apps-guard / import-guard。
import {it,expect} from 'vitest';
import fs from 'node:fs';
const GUARD=/\b(dbArg|protectTarget|productionGate|importFile|exportFile|verifyMigration)\(/;
const OPEN=/\b(openDb|new Database)\(/;
const takesDb=(s:string)=>/--db\b|'db'|"db"|DB_PATH|dbArg\(|Database\(/.test(s);
const files=[...fs.readdirSync('scripts').filter(f=>/\.(ts|mts|mjs)$/.test(f)).map(f=>'scripts/'+f),'server/src/import.ts'];
const dbScripts=files.filter(f=>takesDb(fs.readFileSync(f,'utf8')));
it('the audit covers every script that takes a db path',()=>{
  expect(dbScripts.sort()).toEqual(['scripts/ai-content-export.ts','scripts/ai-content-import.ts','scripts/ai-generate.ts','scripts/ai-review.ts','scripts/freq-daily.ts','scripts/freq-zk-rank.ts','scripts/import-forms.ts','scripts/seed-due.ts','scripts/verify-migration.ts','server/src/import.ts']);
});
it.each(dbScripts)('%s calls the production guard before opening the db',file=>{
  const s=fs.readFileSync(file,'utf8').replace(/^\s*(import|export \{)[^\n]*\n/gm,'');
  const g=s.search(GUARD);expect(g,`${file}: no guard call`).toBeGreaterThanOrEqual(0);
  const o=s.search(OPEN);
  if(o>=0&&o<g)expect(s.slice(o),`${file}: opens the db before the guard`).toMatch(/^(new Database|openDb)\((dbArg|protectTarget)\(/);
});
it('library functions used by scripts guard internally',()=>{
  const t=fs.readFileSync('server/src/ai/transfer.ts','utf8');
  for(const fn of ['importFile','exportFile']){const body=t.slice(t.indexOf(`export async function ${fn}(`)>=0?t.indexOf(`export async function ${fn}(`):t.indexOf(`export function ${fn}(`));expect(body.search(/protectTarget\(/)).toBeLessThan(body.search(/new Database\(/));}
  const v=fs.readFileSync('scripts/verify-migration.ts','utf8'),body=v.slice(v.indexOf('export function verifyMigration('));expect(body.search(/productionGate\(/)).toBeLessThan(body.search(OPEN));
});
