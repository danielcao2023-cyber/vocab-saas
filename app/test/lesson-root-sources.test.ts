import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterEach,expect,it,vi} from 'vitest';
import {extractOriginReferences,fetchLessonRootSources,languageSection,resolveOriginPage,retryAfterMilliseconds} from '../scripts/lesson-root-sources.ts';

const temporary:string[]=[];
afterEach(()=>{for(const dir of temporary.splice(0))fs.rmSync(dir,{recursive:true,force:true});});
const source=(text:string)=>[{url:'https://fr.wiktionary.org/wiki/absent#Anglais',status:'retrieved',retrievalMethod:'mediawiki-api-english-section',text,revisionId:123}];
const english=(text:string)=>`=== {{S|étymologie}} ===\n${text}\n=== {{S|nom|en}} ===\n# English definition`;
const page=(title:string,text:string)=>({pageid:10,title,revisions:[{revid:20,timestamp:'2026-10-18T00:00:00Z',slots:{main:{content:text}}}]});
const data=(...pages:unknown[])=>({query:{pages}});
const response=(body:unknown)=>new Response(JSON.stringify(body));
function fixture(words:Record<number,string>){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'lesson-roots-'));temporary.push(base);
  const sourceDirectory=path.join(base,'source'),outputDirectory=path.join(base,'roots');fs.mkdirSync(sourceDirectory);
  for(const [id,text] of Object.entries(words))fs.writeFileSync(path.join(sourceDirectory,`${id}.json`),JSON.stringify(source(english(text))));
  return {sourceDirectory,outputDirectory};
}

it('isolates the exact origin language including its subheadings, never a same-spelled French entry',()=>{
  const text='== {{langue|fr}} ==\nFrench\n=== {{S|étymologie}} ===\nFrench history\n== {{langue|la}} ==\n=== {{S|adjectif|la}} ===\n# Latin meaning\n==== {{S|dérivés}} ====\nLatin descendants\n== {{langue|de}} ==\nGerman';
  expect(languageSection(text,'la')).toBe('=== {{S|adjectif|la}} ===\n# Latin meaning\n==== {{S|dérivés}} ====\nLatin descendants');
  expect(languageSection(text,'ang')).toBeNull();
});

it('extracts literal mot and third-position forms only inside English etymology blocks',()=>{
  const text=`== {{langue|fr}} ==\n${english('{{étyl|la|en|mot=wrong-french-section}}')}\n== {{langue|en}} ==\n${english('{{étyl|la|en|mot=absens}} et {{étyl|enm|en|aboute}}')}\n{{étyl|la|en|mot=wrong-definition}}\n==== {{S|dérivés}} ====\n{{étyl|la|en|mot=wrong-family}}\n== {{langue|de}} ==\n${english('{{étyl|la|en|mot=wrong-german-section}}')}`;
  const result=extractOriginReferences(source(text));
  expect(result.references.map(r=>[r.originLanguage,r.originForm])).toEqual([['la','absens'],['enm','aboute']]);
  expect(result.references[0].englishSource.etymologyText).not.toContain('English definition');
});

it('rejects non-English links, reconstructed or templated forms, conflicting forms and text hidden in comments',()=>{
  const result=extractOriginReferences(source(english([
    '{{étyl|la|fr|mot=absens}}','{{étyl|gem-pro|en|mot=*form}}','{{étyl|la|en}}',
    '{{étyl|la|en|mot={{lien|nested|la}}}}','{{étyl|la|en|other|mot=conflict}}',
    '{{étyl|la|en|mot=Category:unsafe}}','<!-- {{étyl|la|en|mot=commented}} -->',
    '<nowiki>{{étyl|la|en|mot=quoted}}</nowiki>','{{étyl|1=la|2=en|3=habilitas}}',
  ].join('\n'))));
  expect(result.references.map(r=>r.originForm)).toEqual(['habilitas']);
  expect(result.skipped).toContain('reconstructed-source-form');
});

it('does not accept unrelated URLs or unverified cache provenance as English evidence',()=>{
  const good=source(english('{{étyl|la|en|mot=absens}}'))[0];
  expect(extractOriginReferences([{...good,url:'https://example.com/wiki/absent#Anglais'},{...good,url:'https://fr.wiktionary.org/wiki/absent#Français'},{...good,retrievalMethod:'whole-page'},{...good,status:'failed'}]).references).toEqual([]);
});

it('reports a missing source page separately from a missing exact-language section, without fallback or redirects',()=>{
  expect(resolveOriginPage('ang','abufan',data({title:'abufan',missing:true})).status).toBe('missing-page');
  expect(resolveOriginPage('enm','acounte',data(page('acounte','== {{langue|fr}} ==\nFrench only'))).status).toBe('missing-language-section');
  expect(resolveOriginPage('la','absens',data(page('absens','#REDIRECT [[absent]]'))).status).toBe('missing-language-section');
  expect(resolveOriginPage('la','absens',data(page('absens','== {{langue|fr}} ==\nWrong\n== {{langue|la}} ==\n# absent\n== {{langue|en}} ==\nWrong'))).source?.text).toBe('# absent');
});

it('handles Retry-After seconds and dates without ignoring a server backoff',()=>{
  expect(retryAfterMilliseconds('3')).toBe(3000);
  expect(retryAfterMilliseconds('Sun, 18 Oct 2026 00:00:12 GMT',Date.parse('2026-10-18T00:00:00Z'))).toBe(12000);
  expect(retryAfterMilliseconds('garbage')).toBe(30000);
  expect(retryAfterMilliseconds('0')).toBe(2000);
});

it('batches at most 25 exact titles, pauses serial requests, caches by form and language and never changes input',async()=>{
  const words=Object.fromEntries(Array.from({length:26},(_,i)=>[i+1,`{{étyl|la|en|mot=term${i}}}`]));
  words[27]='{{étyl|fro|en|mot=term0}}';
  const dirs=fixture(words);const before=fs.readFileSync(path.join(dirs.sourceDirectory,'1.json'),'utf8');
  const wait=vi.fn(async()=>{});
  const fetcher=vi.fn(async(url:any)=>{
    const titles=new URL(String(url)).searchParams.get('titles')!.split('|');expect(titles.length).toBeLessThanOrEqual(25);
    return response(data(...titles.map(title=>page(title,'== {{langue|fr}} ==\nNever use this\n== {{langue|la}} ==\n# Latin meaning'))));
  }) as unknown as typeof fetch;
  const options={...dirs,wordIds:Object.keys(words).map(Number),fetcher,wait};
  const stats=await fetchLessonRootSources(options);
  expect(stats).toMatchObject({words:27,origins:27,retrieved:26,missing:1,networkRequests:2});
  expect(wait).toHaveBeenCalledWith(2000);
  expect(fs.readFileSync(path.join(dirs.sourceDirectory,'1.json'),'utf8')).toBe(before);
  const output=JSON.parse(fs.readFileSync(path.join(dirs.outputDirectory,'1.json'),'utf8'));
  expect(output.scope).toContain('does not independently prove a longer historical chain');
  expect(output.origins[0].source.text).toBe('# Latin meaning');
  expect(JSON.parse(fs.readFileSync(path.join(dirs.outputDirectory,'27.json'),'utf8')).origins[0].status).toBe('missing-language-section');
  const rerun=await fetchLessonRootSources(options);
  expect(rerun.networkRequests).toBe(0);expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fs.existsSync(path.join(dirs.outputDirectory,'fetch.lock'))).toBe(false);
});

it('respects retry-after and does not cache transient failures as missing dictionaries',async()=>{
  const dirs=fixture({7:'{{étyl|la|en|mot=absens}}'});const wait=vi.fn(async()=>{});
  const fetcher=vi.fn().mockResolvedValueOnce(new Response('',{status:429,headers:{'retry-after':'4'}})).mockResolvedValueOnce(response(data(page('absens','== {{langue|la}} ==\n# Absent'))));
  expect(await fetchLessonRootSources({...dirs,fetcher,wait})).toMatchObject({retrieved:1,networkRequests:2});
  expect(wait).toHaveBeenCalledWith(4000);
  const failed=fixture({11:'{{étyl|enm|en|mot=acounte}}'});
  const unavailable=vi.fn(async()=>new Response('',{status:503,headers:{'retry-after':'120'}}));
  expect(await fetchLessonRootSources({...failed,fetcher:unavailable,wait})).toMatchObject({failed:1,networkRequests:1});
  expect(fs.readdirSync(path.join(failed.outputDirectory,'cache'))).toEqual([]);
  expect(JSON.parse(fs.readFileSync(path.join(failed.outputDirectory,'11.json'),'utf8')).origins[0].status).toBe('fetch-failed');
});

it('skips evidence with no literal source form and refuses overwriting source evidence',async()=>{
  const dirs=fixture({1:'{{étyl|ang|en}}'});const fetcher=vi.fn();
  expect(await fetchLessonRootSources({...dirs,fetcher})).toMatchObject({skipped:1,origins:0,networkRequests:0});
  expect(fetcher).not.toHaveBeenCalled();
  await expect(fetchLessonRootSources({...dirs,outputDirectory:dirs.sourceDirectory})).rejects.toThrow('must not overwrite');
  const alias=path.join(path.dirname(dirs.sourceDirectory),'alias');fs.symlinkSync(dirs.sourceDirectory,alias,'dir');
  await expect(fetchLessonRootSources({...dirs,outputDirectory:alias})).rejects.toThrow('must not overwrite');
  await expect(fetchLessonRootSources({...dirs,outputDirectory:path.join(alias,'new-root-cache')})).rejects.toThrow('must not overwrite');
  expect(fs.existsSync(path.join(dirs.sourceDirectory,'new-root-cache'))).toBe(false);
});

it('stops further batches after exhausted rate limits instead of requesting before the final Retry-After',async()=>{
  const words=Object.fromEntries(Array.from({length:26},(_,i)=>[i+1,`{{étyl|la|en|mot=term${i}}}`]));
  const dirs=fixture(words),wait=vi.fn(async()=>{}),fetcher=vi.fn(async()=>new Response('',{status:429,headers:{'retry-after':'8'}}));
  expect(await fetchLessonRootSources({...dirs,wordIds:Object.keys(words).map(Number),fetcher,wait})).toMatchObject({failed:26,networkRequests:3});
  expect(wait.mock.calls).toEqual([[8000],[8000]]);
  expect(fs.readdirSync(path.join(dirs.outputDirectory,'cache'))).toEqual([]);
});
