// fix1 截图：错词本（有词/空，空状态用拦截 /api/wrong 返回空列表）、首页补签提示与不可补日期说明、家长页折线
import { chromium } from '/workspace/vocab-saas/.tools/node_modules/playwright-core/index.mjs';
const BASE = 'http://127.0.0.1:18424', OUT = '/workspace/vocab-saas/v3/phase1-shots';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const errors = [], out = {};
async function page(route) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', locale: 'zh-CN' });
  const p = await ctx.newPage();
  p.on('console', m => m.type() === 'error' && errors.push(m.text())); p.on('pageerror', e => errors.push('pageerror ' + e.message));
  if (route) await p.route('**/api/wrong?*', r => r.fulfill({ json: { items: [], total: 0, practicedTwiceThisWeek: 0 } })), await p.route('**/api/wrong', r => r.fulfill({ json: { items: [], total: 0, practicedTwiceThisWeek: 0 } }));
  return p;
}
const full = async (p, name) => { await p.waitForTimeout(300); const h = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewportSize({ width: 1280, height: Math.max(800, h) }); await p.screenshot({ path: `${OUT}/${name}.png` }); };
let p = await page(false);
await p.goto(BASE); await p.waitForSelector('.page h1');
out.homeHint = await p.locator('[data-testid=makeup-hint]').textContent();
const missed = p.locator('.cal button.d.missed:not([disabled])');
out.clickableMissed = await missed.count();
if (out.clickableMissed) { await missed.first().click(); await p.waitForTimeout(200); out.blockedMsg = await p.locator('.panel .retry').first().textContent(); }
await full(p, 'fix1-home-makeup-hint');
await p.setViewportSize({ width: 1280, height: 800 });
await p.getByRole('button', { name: '错词本' }).first().click(); await p.waitForSelector('.page h1');
out.wrongHead = await p.locator('.headrow p').first().textContent();
await full(p, 'fix1-wrong');
p = await page(true);
await p.goto(BASE); await p.waitForSelector('.page h1');
out.homeEmptyNote = await p.locator('section.panel p.small.muted').first().textContent();
await p.getByRole('button', { name: '错词本' }).first().click(); await p.waitForSelector('.empty');
out.wrongEmpty = await p.locator('.empty p').first().textContent();
await full(p, 'fix1-wrong-empty');
p = await page(false);
await p.goto(BASE + '/parent'); await p.waitForSelector('.accuracy-chart');
const svg = await p.locator('.accuracy-chart').boundingBox(); const circles = await p.locator('.accuracy-chart circle').evaluateAll(cs => cs.map(c => c.getBoundingClientRect()).map(r => ({ x: r.x, right: r.right })));
out.chart = { svgRight: svg.x + svg.width, lastCircleRight: circles.at(-1)?.right, circles: circles.length };
await p.locator('.accuracy-chart').screenshot({ path: `${OUT}/fix1-parent-chart.png` });
console.log(JSON.stringify({ out, errors }, null, 1));
await browser.close();
