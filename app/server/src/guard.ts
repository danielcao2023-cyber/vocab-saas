// 正式库保护：$HOME/apps 下（按 realpath 解析，含符号链接和尚不存在的路径）的库默认一律拒绝。
// home 参数只为测试注入；脚本里用 os.homedir()（即 $HOME）。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Database from 'better-sqlite3';

/** realpath；路径末端不存在时解析到最近一个存在的祖先再拼回去。 */
export function resolved(file: string) {
  let p = path.resolve(file); const suffix: string[] = [];
  while (!fs.existsSync(p)) { const parent = path.dirname(p); if (parent === p) break; suffix.unshift(path.basename(p)); p = parent; }
  return path.join(fs.realpathSync(p), ...suffix);
}
export function appsRoot(home = os.homedir()) { return resolved(path.join(home, 'apps')); }
export function isProduction(file: string, home = os.homedir()) {
  if (file === ':memory:') return false;
  const p = resolved(file), apps = appsRoot(home);
  return p === apps || p.startsWith(apps + path.sep);
}
export function protectTarget(file: string, home = os.homedir()) {
  if (isProduction(file, home)) throw new Error(`拒绝：${file} 解析后位于 ${appsRoot(home)} 下，是正式库。正式库要在上线时另批。`);
}

const STAMP = /\.\d{8}-\d{6}(?:\.[a-z0-9-]+)?$/i; // 例：vocab.db.20261017-190000.bak
/** 正式库放行条件：--allow-production 且 --backup 路径不在库所在目录，或是库的带时间戳同级文件；不能已存在。 */
export function checkBackupPath(dbFile: string, backup: string) {
  const db = resolved(dbFile), b = resolved(backup);
  if (b === db) throw new Error('--backup 不能是库本身');
  if (fs.existsSync(backup) || fs.existsSync(b)) throw new Error(`--backup ${backup} 已存在，请换一个新路径`);
  const sameDir = path.dirname(b) === path.dirname(db);
  if (sameDir && !(path.basename(b).startsWith(path.basename(db) + '.') && STAMP.test(path.basename(b).slice(path.basename(db).length))))
    throw new Error(`--backup 在库所在目录时必须是带时间戳的同级文件，例如 ${path.basename(db)}.20261017-190000.bak`);
  return b;
}
export interface ProductionGate { allowProduction?: boolean; backup?: string; dryRun?: boolean; home?: string }
/** 返回 { production, backup }；不满足条件时抛出清楚的中文错误。只做检查，不写任何东西。 */
export function productionGate(file: string, g: ProductionGate) {
  const production = isProduction(file, g.home);
  if (!production) return { production, backup: undefined };
  if (!g.allowProduction) throw new Error(`拒绝：${file} 解析后位于 ${appsRoot(g.home)} 下，是正式库。确需上线导入时同时加 --allow-production 和 --backup <库目录外的路径，或带时间戳的同级文件>。`);
  if (g.dryRun) return { production, backup: undefined };
  if (!g.backup) throw new Error('正式库导入需要 --backup <路径>：写入前先做备份并校验。');
  return { production, backup: checkBackupPath(file, g.backup) };
}

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
function tableDigest(db: Database.Database) {
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map(t => t.name);
  return sha(Buffer.from(JSON.stringify(tables.map(t => [t, db.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all()]))));
}
/**
 * 写入前备份：只读连接在线备份（含 WAL），然后校验：备份文件 sha256 写到 <backup>.sha256 并回读比对，
 * 备份与原库逐表内容摘要一致、integrity_check=ok。任何一步失败都抛错，调用方不得继续写。
 */
export async function verifiedBackup(file: string, backup: string) {
  const src = new Database(file, { readonly: true, fileMustExist: true });
  let source: string;
  try { await src.backup(backup); source = tableDigest(src); } finally { src.close(); }
  const bytes = fs.readFileSync(backup), digest = sha(bytes);
  fs.writeFileSync(backup + '.sha256', `${digest}  ${path.basename(backup)}\n`);
  if (sha(fs.readFileSync(backup)) !== fs.readFileSync(backup + '.sha256', 'utf8').split(' ')[0]) throw new Error('备份校验失败：sha256 不一致，未写入正式库');
  const mem = Buffer.from(bytes); if (mem.length >= 100) { mem[18] = 1; mem[19] = 1; } // WAL 头不能反序列化，只改内存副本
  const copy = new Database(mem); // 内存里校验，不在备份旁边生成 -wal/-shm
  try {
    if (copy.pragma('integrity_check', { simple: true }) !== 'ok') throw new Error('备份校验失败：integrity_check 不是 ok，未写入正式库');
    if (tableDigest(copy) !== source) throw new Error('备份校验失败：备份内容与原库不一致，未写入正式库');
  } finally { copy.close(); }
  return { backup, sha256: digest, bytes: bytes.length };
}

/**
 * dry-run 用的只读快照：绝不在库旁边创建或改写任何文件。
 * 没有 -wal（或为空）时直接读主文件字节；有 WAL 时必须已有 -shm（服务在跑），此时只读连接读取，不新建文件。
 */
export function readSnapshot(file: string): Buffer {
  const wal = file + '-wal', shm = file + '-shm';
  const walSize = fs.existsSync(wal) ? fs.statSync(wal).size : 0;
  if (walSize === 0) { if (fs.existsSync(wal) && !fs.existsSync(shm)) throw new Error(`dry-run：${wal} 存在但没有 -shm，为避免改动库目录，请先用副本`); return fs.readFileSync(file); }
  if (!fs.existsSync(shm)) throw new Error(`dry-run：${file} 有未合并的 WAL 但没有 -shm，为避免在库目录生成文件，请先用副本`);
  const db = new Database(file, { readonly: true, fileMustExist: true });
  try { return db.serialize(); } finally { db.close(); }
}
