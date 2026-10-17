// 第二期查词/词表视觉稿截图：p2-*.html → shots/p2-*-desktop|mobile.png
import { chromium } from '/workspace/vocab-saas/.tools/node_modules/playwright-core/index.mjs';
import fs from 'node:fs'; import path from 'node:path';
const dir = path.resolve(import.meta.dirname, '..');
const D = { width: 1280, height: 800 }, M = { width: 390, height: 844 };
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
for (const f of fs.readdirSync(dir).filter(f => /^p2-.*\.html$/.test(f)).sort()) {
  const mobile = f.endsWith('-m.html'), vp = mobile ? M : D;
  const out = f.replace(/(-m)?\.html$/, '') + (mobile ? '-mobile' : '-desktop');
  if (only && !only.test(out)) continue;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, reducedMotion: 'reduce', locale: 'zh-CN' });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('requestfailed', r => errs.push('FAIL ' + r.url()));
  await p.goto('file://' + path.join(dir, f)); await p.waitForLoadState('networkidle');
  const h = await p.evaluate(() => Math.max(document.documentElement.scrollHeight, ...[...document.querySelectorAll('.sr')].map(e => e.getBoundingClientRect().bottom + 24)));
  if (h > vp.height) await p.setViewportSize({ width: vp.width, height: Math.ceil(h) });
  await p.screenshot({ path: path.join(dir, 'shots', out + '.png') });
  console.log(out, errs.length ? errs : 'ok'); await ctx.close();
}
await browser.close();
