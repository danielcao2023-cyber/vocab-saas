// 用系统已装的 Google Chrome（无需下载浏览器）+ 项目本地 playwright-core 截图
import { chromium } from '/workspace/vocab-saas/.tools/node_modules/playwright-core/index.mjs';
import path from 'node:path';
const dir = path.resolve(import.meta.dirname, '..');
const D = { width: 1280, height: 800 }, M = { width: 390, height: 844 };
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const jobs = [
  ['home', D, 'home-desktop'], ['home', M, 'home-mobile'],
  ['card-front', D, 'card-front-desktop'], ['card-front', M, 'card-front-mobile'],
  ['card-back', D, 'card-back-desktop'], ['card-back-ecdict', M, 'card-back-mobile'],
  ['q-listen', D, 'q-listen-desktop'], ['q-meaning-correct', D, 'q-meaning-correct-desktop'],
  ['q-meaning-wrong', D, 'q-meaning-wrong-desktop'], ['q-meaning-wrong', M, 'q-meaning-wrong-mobile'],
  ['spell', D, 'spell-desktop'], ['wrong', D, 'wrong-desktop'], ['wrong', M, 'wrong-mobile'],
  ['empty', D, 'empty-wrong-desktop'], ['done', D, 'done-desktop'], ['parent', D, 'parent-desktop'],
  ['card-back-explain', D, 'card-back-explain-desktop'], ['card-back-explain-m', M, 'card-back-explain-mobile'], ['explain-pending', M, 'explain-pending-mobile'],
];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
for (const [page, vp, out] of jobs) {
  if (only && !only.test(out)) continue;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: vp.width < 500 ? 2 : 1, reducedMotion: 'reduce', locale: 'zh-CN' });
  const p = await ctx.newPage();
  const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('requestfailed', (r) => errs.push('FAIL ' + r.url()));
  await p.goto('file://' + path.join(dir, page + '.html'));
  await p.waitForLoadState('networkidle');
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  if (h > vp.height) await p.setViewportSize({ width: vp.width, height: h }); // 让 fixed 底栏落在页面底部
  await p.screenshot({ path: path.join(dir, 'shots', out + '.png') });
  const ext = await p.evaluate(() => [...document.querySelectorAll('link,script,img')].map((e) => e.href || e.src).filter((u) => u && !u.startsWith('file:')));
  console.log(out, errs.length ? errs : 'ok', ext.length ? 'EXTERNAL ' + ext : '');
  await ctx.close();
}
await browser.close();
