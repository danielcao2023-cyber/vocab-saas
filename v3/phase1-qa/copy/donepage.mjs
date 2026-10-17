import { chromium } from '/workspace/vocab-saas/.tools/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const p = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', locale: 'zh-CN' })).newPage();
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.goto('http://127.0.0.1:18424'); await p.waitForSelector('.page h1');
await p.getByRole('button', { name: '开始复习' }).click(); await p.waitForSelector('.done-page');
const text = await p.locator('.done-page').textContent();
await p.screenshot({ path: '/workspace/vocab-saas/v3/phase1-shots/copy-done-page.png' });
console.log(JSON.stringify({ text, errors })); await browser.close();
