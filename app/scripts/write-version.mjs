// 构建时把 git 短哈希写进 dist/version.json；拿不到就写 unknown，绝不失败
import { execSync } from 'node:child_process';
import fs from 'node:fs';
let commit = 'unknown', dirty = false;
try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'unknown';
  dirty = execSync('git status --porcelain --untracked-files=no', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== '';
} catch { commit = 'unknown'; }
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/version.json', JSON.stringify({ commit, dirty, builtAt: new Date().toISOString() }) + '\n');
console.log('version.json', commit, dirty ? '(dirty)' : '');
