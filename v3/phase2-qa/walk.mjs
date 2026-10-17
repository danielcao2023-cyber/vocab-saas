import { chromium } from '/workspace/vocab-saas/.tools/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
const BASE='http://127.0.0.1:18425',OUT='/workspace/vocab-saas/v3/phase2-shots';
const D={width:1280,height:800},M={width:390,height:844};
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const errors=[],log=[];
async function page(vp){const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:vp.width<500?2:1,reducedMotion:'reduce',locale:'zh-CN'});const p=await ctx.newPage();p.on('console',m=>m.type()==='error'&&errors.push(m.text()));p.on('pageerror',e=>errors.push('pageerror '+e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});return {ctx,p};}
async function shot(p,vp,name,full=false){await p.waitForTimeout(300);if(full){const h=await p.evaluate(()=>document.documentElement.scrollHeight);await p.setViewportSize({width:vp.width,height:Math.max(vp.height,h)});}await p.screenshot({path:`${OUT}/${name}.png`});await p.setViewportSize(vp);log.push(name);}
async function search(vp,suffix){const {ctx,p}=await page(vp);await p.goto(BASE+'/');await p.waitForSelector('.search-wrap');
  for(const [name,q] of [['en','receive'],['zh','收到'],['inflect','went'],['empty','zzzz']]){
    if(vp.width<500){await p.click('.mbtn');}else await p.click('.search input');
    await p.fill('.search input',q);await p.waitForTimeout(600);
    const text=await p.evaluate(()=>document.querySelector('.search-wrap')?.innerText??'');log.push(`${name}-${suffix}: ${text.replace(/\s+/g,' ').slice(0,200)}`);
    await shot(p,vp,`p2-search-${name}-${suffix}`);await p.fill('.search input','');await p.keyboard.press('Escape');await p.waitForTimeout(200);}
  // Enter 打开结果
  if(vp.width>=500){await p.click('.search input');await p.fill('.search input','went');await p.waitForTimeout(600);await p.keyboard.press('Enter');await p.waitForTimeout(600);log.push('enter-open: '+p.url());}
  await ctx.close();}
async function word(vp,suffix,id,tag){const {ctx,p}=await page(vp);await p.goto(`${BASE}/?word=${id}`);await p.waitForSelector('.explain',{timeout:10000});await shot(p,vp,`p2-word-${tag}-${suffix}`,true);
  if(suffix==='desktop'&&tag==='receive'){await p.click('.explain .link');await p.waitForTimeout(300);await shot(p,vp,`p2-word-${tag}-expanded-${suffix}`,true);
    // 反馈：点第一个“这条有问题” → 例句不通
    const before=await (await fetch(`${BASE}/api/word/${id}/content`)).json();
    await p.locator('.report').first().click();await p.locator('.feedback-options .btn').first().click();await p.waitForTimeout(500);await shot(p,vp,`p2-word-${tag}-feedback-${suffix}`,true);
    const after=await (await fetch(`${BASE}/api/word/${id}/content`)).json();log.push(`feedback: blocks ${before.blocks.length} -> ${after.blocks.length}`);
    await p.click('.back, button:has-text("← 返回")').catch(()=>{});}
  await ctx.close();}
async function browse(vp,suffix){const {ctx,p}=await page(vp);await p.goto(BASE+'/');await p.waitForSelector(vp.width<500?'.bottombar':'.tabs');
  await p.locator(vp.width<500?'.bottombar button':'.tabs button',{hasText:'词表'}).first().click();await p.waitForSelector('.blist .brow');await shot(p,vp,`p2-browse-zk-${suffix}`,vp.width>=500);
  await p.locator('.seg button',{hasText:'日常高频'}).click();await p.waitForTimeout(500);await shot(p,vp,`p2-browse-daily-${suffix}`,vp.width>=500);
  await p.locator('.blist .brow').first().click();await p.waitForSelector('.explain');log.push('browse-open: '+p.url());await p.goBack();await p.waitForSelector('.blist .brow');log.push('back: '+p.url()+' daily-on='+(await p.locator('.seg button.on').textContent()));
  await ctx.close();}
await search(D,'desktop');await search(M,'mobile');
await word(D,'desktop',1129,'receive');await word(M,'mobile',1129,'receive');await word(D,'desktop',583,'go');
await browse(D,'desktop');await browse(M,'mobile');
await browser.close();
fs.writeFileSync('/workspace/vocab-saas/v3/phase2-qa/walk.json',JSON.stringify({log,errors},null,1));console.log(JSON.stringify({log,errors},null,1));
