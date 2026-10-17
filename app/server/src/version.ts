import fs from 'node:fs';
import path from 'node:path';

/** 运行时版本：APP_COMMIT 环境变量 > <staticDir>/version.json > unknown。不调用 git，不抛错。 */
export function readVersion(staticDir = 'dist'): { commit: string; dirty?: boolean; builtAt?: string; source: string } {
  if (process.env.APP_COMMIT) return { commit: process.env.APP_COMMIT, source: 'env' };
  try {
    const j = JSON.parse(fs.readFileSync(path.join(staticDir, 'version.json'), 'utf8'));
    if (j && typeof j.commit === 'string') return { commit: j.commit, dirty: !!j.dirty, builtAt: j.builtAt, source: 'version.json' };
  } catch { /* 忽略 */ }
  return { commit: 'unknown', source: 'none' };
}
