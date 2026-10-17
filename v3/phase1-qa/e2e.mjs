import { chromium } from '/workspace/vocab-saas/.tools/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
const BASE = 'http://127.0.0.1:18424', OUT = '/workspace/vocab-saas/v3/phase1-shots';
const D = { width: 1280, height: 800 }, M = { width: 390, height: 844 };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const log = []; const errors = [];
async function ctxPage(vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: vp.width < 500 ? 2 : 1, reducedMotion: 'reduce', locale: 'zh-CN' });
  const p = await ctx.newPage(); const st = { next: null, vp };
  p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  p.on('pageerror', e => errors.push('pageerror ' + e.message));
  p.on('response', async r => { if (r.url().includes('/api/next')) { try { st.next = await r.json(); st.mode = 'study'; } catch {} } if (r.url().includes('/api/wrong/practice')) { try { st.queue = (await r.json()).items; st.mode = 'practice'; } catch {} } if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  return { ctx, p, st };
}
async function shot(p, vp, name) {
  await p.waitForTimeout(250);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await p.screenshot({ path: `${OUT}/${name}.png` }); await p.setViewportSize(vp); log.push(name);
}
const want = new Set(['flip-front', 'flip-back', 'listen-q', 'listen-correct', 'listen-wrong', 'meaning-q', 'meaning-correct', 'meaning-wrong', 'spell-wrong', 'spell-correct', 'dictation-wrong']);
const counts = { flip: 0, listen_choice: 0, meaning_choice: 0, spell: 0, dictation: 0, answers: 0 };
async function study(p, st, vp, prefix, max = 400, wrongRate = 0) {
  for (let i = 0; i < max; i++) {
    await p.waitForFunction(() => document.querySelector('article.card') || document.querySelector('.done-page'), null, { timeout: 15000 });
    if (await p.$('.done-page')) return 'done';
    await p.waitForTimeout(60);
    let t = st.next; if (st.mode === 'practice') { const n = Number((await p.locator('.studybar .num').textContent()).split('/')[0]); t = st.queue[n]; }
    if (!t?.card) { await p.waitForTimeout(200); continue; }
    const { card, question } = t; counts.answers++;
    const sh = async (n) => { if (want.has(n)) { want.delete(n); await shot(p, vp, prefix + n); } };
    if (question) {
      counts[question.qtype]++;
      const kind = question.qtype === 'listen_choice' ? 'listen' : 'meaning';
      await sh(kind + '-q');
      const goWrong = (kind === 'listen' && want.has('listen-wrong') && !want.has('listen-correct')) || (kind === 'meaning' && want.has('meaning-wrong') && !want.has('meaning-correct')) || Math.random() < wrongRate;
      const idx = question.options.findIndex(o => (o.wordId === card.word_id) !== goWrong);
      await p.locator('.opt').nth(idx).click();
      await p.waitForSelector('.fb');
      await sh(kind + (goWrong ? '-wrong' : '-correct'));
      await p.getByRole('button', { name: '下一个' }).click();
    } else if (card.mode === 'recognize') {
      counts.flip++;
      await sh('flip-front'); await p.getByRole('button', { name: '翻面' }).click(); await p.waitForSelector('.rates');
      await sh('flip-back'); await p.locator('.rate').nth(Math.random() < wrongRate ? 0 : 2).click();
    } else {
      counts[card.mode]++;
      const right = card.headword.replace(/[’]/g, "'").split(/\s*[(/（]/)[0].trim();
      const goWrong = want.has(card.mode + '-wrong') || Math.random() < wrongRate;
      const typed = goWrong ? (right.length > 3 ? right.slice(0, -2) + right.slice(-1) + right.slice(-2, -1) : right + 'x') : right;
      await p.locator('input.input').fill(typed); await p.keyboard.press('Enter'); await p.waitForSelector('.fb');
      await sh(card.mode + (goWrong ? '-wrong' : '-correct'));
      await p.keyboard.press('Enter');
    }
    await p.waitForTimeout(80);
  }
  return 'max';
}
// 1) 手机首页和一张卡（不作答）
{ const { ctx, p, st } = await ctxPage(M); await p.goto(BASE); await p.waitForSelector('.today'); await shot(p, M, 'm-home');
  await p.getByRole('button', { name: '开始复习' }).click(); await p.waitForSelector('article.card'); await shot(p, M, 'm-study-first'); await ctx.close(); }
// 2) 桌面：首页 → 学完今天
const { ctx, p, st } = await ctxPage(D);
await p.goto(BASE); await p.waitForSelector('.today'); await shot(p, D, 'd-home-before');
await p.getByRole('button', { name: '开始复习' }).click();
let r = await study(p, st, D, 'd-', 400, 0.12);
log.push('study-result ' + r + ' ' + JSON.stringify(counts));
await shot(p, D, 'd-done');
fs.writeFileSync(OUT + '/today-after.json', JSON.stringify(await (await fetch(BASE + '/api/today')).json(), null, 1));
await p.getByRole('button', { name: '回首页' }).click(); await p.waitForSelector('.today'); await shot(p, D, 'd-home-after');
// 3) 补签：点第一个可补签日期
const can = p.locator('.cal .d.can-makeup');
log.push('makeup candidates ' + await can.count());
if (await can.count()) { await can.last().click(); await p.waitForTimeout(600); await shot(p, D, 'd-home-makeup'); }
// 4) 错词本 + 练习
await p.getByRole('button', { name: '错词本' }).first().click(); await p.waitForSelector('.page h1'); await shot(p, D, 'd-wrong');
const sortRecent = p.getByRole('button', { name: /最近/ }); if (await sortRecent.count()) { await sortRecent.first().click(); await p.waitForTimeout(400); await shot(p, D, 'd-wrong-recent'); }
for (const k of ['flip-front', 'listen-q', 'meaning-q', 'spell-wrong', 'listen-correct', 'meaning-correct']) want.add(k);
const pr = p.getByRole('button', { name: /练/ }).first(); await pr.click();
r = await study(p, st, D, 'd-practice-', 30, 0.3); log.push('practice-result ' + r);
await shot(p, D, 'd-practice-done');
await ctx.close();
// 5) 手机错词本、家长页
{ const { ctx, p } = await ctxPage(M); await p.goto(BASE); await p.waitForSelector('.today'); await shot(p, M, 'm-home-after');
  await p.locator('.bottombar button', { hasText: '错词本' }).click(); await p.waitForTimeout(500); await shot(p, M, 'm-wrong');
  const html = await p.content(); log.push('child page mentions parent: ' + /parent|家长/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')));
  await ctx.close(); }
for (const [vp, n] of [[D, 'd-parent'], [M, 'm-parent']]) { const { ctx, p } = await ctxPage(vp); await p.goto(BASE + '/parent'); await p.waitForTimeout(1200); await shot(p, vp, n);
  log.push(n + ' links: ' + JSON.stringify(await p.$$eval('a,button', els => els.map(e => e.textContent.trim()).filter(Boolean)))); await ctx.close(); }
await browser.close();
console.log(log.join('\n')); console.log('errors', JSON.stringify(errors.slice(0, 20)), errors.length); console.log('missing shots', [...want]);
