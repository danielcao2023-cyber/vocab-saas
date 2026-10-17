// copy round 浏览器走查（headless Chrome，18424）。阶段：before | grad | done | makeup
import { chromium } from '/workspace/vocab-saas/.tools/node_modules/playwright-core/index.mjs';
const BASE = 'http://127.0.0.1:18424', OUT = '/workspace/vocab-saas/v3/phase1-shots', stage = process.argv[2];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', locale: 'zh-CN' });
const p = await ctx.newPage(); const errors = [], out = {};
p.on('console', m => m.type() === 'error' && errors.push(m.text())); p.on('pageerror', e => errors.push('pageerror ' + e.message));
p.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
const shot = async (name, el) => { await p.waitForTimeout(300); if (el) return p.locator(el).first().screenshot({ path: `${OUT}/copy-${name}.png` }); await p.screenshot({ path: `${OUT}/copy-${name}.png` }); };
const hint = () => p.locator('[data-testid=makeup-hint]').textContent();
const msg = async () => (await p.locator('.cal').locator('xpath=..').locator('.retry').count()) ? p.locator('.cal').locator('xpath=..').locator('.retry').first().textContent() : null;
const day = d => p.locator(`.cal button.d[title^="${d} "]`);
await p.goto(BASE); await p.waitForSelector('.page h1');
if (stage === 'before') {
  out.hint = await hint();
  await day('2026-10-16').click(); out.click1016 = await msg();
  await day('2026-10-04').click(); out.click1004 = await msg();
  out.comparison = await p.locator('.today .note').last().textContent();
  await shot('before-done'); await shot('calendar-before', '.grid > section.panel');
  await shot('week-comparison', '.panel.today');
}
if (stage === 'grad') {
  await p.getByRole('button', { name: '错词本' }).first().click(); await p.waitForSelector('.headrow');
  out.wrongBefore = { head: await p.locator('h1').textContent(), sub: await p.locator('.headrow p').first().textContent(), first: await p.locator('.witem .w').first().textContent(), dots: await p.locator('.witem .dots span').first().textContent() };
  await shot('wrong-before-grad');
  const qp = p.waitForResponse(r => r.url().includes('/api/wrong/practice'));
  await p.locator('.headrow .btn.primary').click(); const queue = (await (await qp).json()).items; const t = queue[0];
  out.practiceFirst = { headword: t.card.headword, mode: t.card.mode, qtype: t.question?.qtype ?? null };
  await p.waitForSelector('article.card');
  const saved = p.waitForResponse(r => /\/api\/(answer|review|check)$/.test(r.url()) && r.request().method() === 'POST');
  if (t.question) await p.locator('.opt').nth(t.question.options.findIndex(o => o.wordId === t.card.word_id)).click();
  else if (t.card.mode === 'recognize') { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); await p.keyboard.press('3'); }
  else { await p.locator('input.input').fill(t.card.headword.replace(/\s*\(.*$/, '').split('/')[0].trim()); await p.keyboard.press('Enter'); }
  const res = await saved; out.answer = { status: res.status(), body: await res.json() };
  await shot('grad-answer');
  await p.waitForTimeout(300); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  if (await p.locator('.studybar .x').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
  await p.goto(BASE); await p.waitForSelector('.page h1');
  await p.getByRole('button', { name: '错词本' }).first().click(); await p.waitForSelector('.headrow');
  out.wrongAfter = { head: await p.locator('h1').textContent(), sub: await p.locator('.headrow p').first().textContent(), stillListed: (await p.locator('.witem .w').allTextContents()).some(s => s.startsWith(t.card.headword)) };
  await shot('wrong-after-grad');
}
if (stage === 'done') {
  out.hint = await hint(); out.candidates = await p.locator('.cal button.d.can-makeup').count();
  await shot('calendar-done', '.grid > section.panel');
  await p.goto(BASE + '/'); // DoneView 不在这里；完成页文案由单测覆盖
}
if (stage === 'makeup') {
  for (const d of ['2026-10-16', '2026-10-15']) { await day(d).click(); await p.waitForTimeout(400); }
  out.hint = await hint(); out.left = await p.locator('.cal-head .small').textContent();
  await day('2026-10-13').click(); out.click1013 = await msg();
  await shot('calendar-used-up', '.grid > section.panel');
  out.badge = await p.locator('header .chip').first().textContent();
}
console.log(JSON.stringify({ stage, out, errors }, null, 1));
await browser.close();
