/** Cache public English entries for editors; this never writes vocabulary or learner data. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { args, cli, dbArg, isMain } from '../server/src/ai/cli.ts';
import { projectRoot } from '../server/src/ai/codex-runner.ts';
import { acquireLock } from '../server/src/ai/pipeline.ts';
import { mainHeadwords } from '../server/src/text.ts';
import { atomicJson, readLessonWords } from './lesson-generate.ts';

export function englishSection(wikitext: string): string | null {
  const start = /^==\s*\{\{langue\|en\}\}\s*==\s*$/m.exec(wikitext);
  if (!start) return null;
  const remaining = wikitext.slice(start.index + start[0].length);
  const next = /^==[^=\n].*?==\s*$/m.exec(remaining);
  return remaining.slice(0, next?.index).trim();
}
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
export async function fetchLessonSources(file: string) {
  const directory = path.join(projectRoot(), '.tmp/lesson-source-evidence');
  const rawDir = path.join(directory, 'raw'); fs.mkdirSync(rawDir,{recursive:true});
  const words = readLessonWords(file).filter(word => !fs.existsSync(path.join(directory,`${word.id}.json`)));
  const unlock = acquireLock(path.join(directory,'fetch.lock'));
  let ready=0, unavailable=0;
  try {
    for(let offset=0;offset<words.length;offset+=25) {
      const batch=words.slice(offset,offset+25);
      const titles=batch.map(word=>mainHeadwords(word.headword)[0]);
      const params=new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'revisions',rvprop:'content|ids|timestamp',rvslots:'main',titles:[...new Set(titles)].join('|')});
      const url=`https://fr.wiktionary.org/w/api.php?${params}`;
      let data: any;
      for(let attempt=0;attempt<3;attempt++) {
        try {
          const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'VocabLessonReference/1.0 (educational reference; https://github.com/danielcao2023-cyber)'}});
          if(response.status===429||response.status===503) {
            const retry=response.headers.get('retry-after');
            const seconds=retry && /^\d+$/.test(retry)?Number(retry):retry?Math.max(0,(Date.parse(retry)-Date.now())/1000):30;
            await wait(Math.max(30000,Number.isFinite(seconds)?seconds*1000:30000)); continue;
          }
          if(!response.ok) throw new Error(`source HTTP ${response.status}`);
          const text=await response.text();data=JSON.parse(text);
          if(!Array.isArray(data.query?.pages)) throw new Error('invalid dictionary response');
          fs.writeFileSync(path.join(rawDir,`${sha(url)}.json`),text);break;
        } catch(e) { if(attempt===2) throw e; await wait(5000*(attempt+1)); }
      }
      if(!data) throw new Error('source temporarily rate limited; rerun to resume');
      const normalized=new Map<string,string>((data.query.normalized??[]).map((item:any)=>[item.from,item.to]));
      for(const [index,word] of batch.entries()) {
        const title=normalized.get(titles[index])??titles[index];
        const page=data.query.pages.find((p:any)=>p.title===title);
        const revision=page?.revisions?.[0];
        const raw=revision?.slots?.main?.content;
        const section=typeof raw==='string'?englishSection(raw):null;
        const fetchedAt=new Date().toISOString();
        if(!section) { unavailable++; continue; }
        // The English-language section can contain French explanatory prose. Never substitute the French entry.
        atomicJson(path.join(directory,`${word.id}.json`),[{
          url:`https://fr.wiktionary.org/wiki/${encodeURIComponent(title)}#Anglais`, status:'retrieved',fetchedAt,
          kind:'etymology',retrievalMethod:'mediawiki-api-english-section', pageId:page.pageid, revisionId:revision.revid,
          revisionTimestamp:revision.timestamp,sha256:sha(section),language:'English entry; French editorial explanation',
          license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',
          text:section.slice(0,35000),truncated:section.length>35000,
        }]); ready++;
      }
      atomicJson(path.join(directory,'progress.json'),{updatedAt:new Date().toISOString(),planned:words.length,attempted:Math.min(offset+25,words.length),ready,unavailable});
      process.stdout.write(`dictionary references ${Math.min(offset+25,words.length)}/${words.length}; English entries ${ready}; unavailable ${unavailable}\n`);
      await wait(2000);
    }
    return {ready,unavailable};
  } finally {unlock();}
}
if(isMain(import.meta.url)) cli(()=>fetchLessonSources(dbArg(args())));
