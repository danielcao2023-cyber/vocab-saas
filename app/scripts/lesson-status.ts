import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { args, cli, dbArg, isMain } from '../server/src/ai/cli.ts';
import { defaultLessonDir, inspectLessonFile, validateLesson } from '../server/src/lessons.ts';
import { readLessonWords, atomicJson } from './lesson-generate.ts';

/** Report content coverage independently of generated jobs, examples or older core blocks. */
export function lessonStatus(database: string, directory = defaultLessonDir) {
  const words=readLessonWords(database);
  const rows=words.map(word=>{
    const file=path.join(directory,`${word.id}.json`);
    const base={id:word.id,headword:word.headword};
    if(!fs.existsSync(file)) return {...base,status:'missing' as const};
    try {
      const safe=inspectLessonFile(directory,word.id);
      const content=fs.readFileSync(safe.file,'utf8'), result=validateLesson(JSON.parse(content),word);
      if(!result.ok) return {...base,status:'invalid' as const,errors:result.errors};
      const lesson=result.lesson;
      return {...base,status:lesson.editorial.status,sha256:createHash('sha256').update(content).digest('hex'),
        senses:lesson.senses.length,coreExamples:lesson.senses.reduce((n,s)=>n+s.examples.length,0),
        patterns:lesson.senses.reduce((n,s)=>n+s.patterns.length,0),collocations:lesson.senses.reduce((n,s)=>n+s.collocations.length,0),
        similar:lesson.senses.reduce((n,s)=>n+s.relatedExpressions.similar.length,0),contrasting:lesson.senses.reduce((n,s)=>n+s.relatedExpressions.contrasting.length,0),
        historicalStages:lesson.etymology.stages.length,family:lesson.wordFamily.length,
        verifiedSources:lesson.sources.filter(source=>source.verification==='verified').length,
        editorial:lesson.editorial};
    } catch {return {...base,status:'invalid' as const,errors:['unreadable lesson file']};}
  });
  const counts={reviewed:0,draft:0,invalid:0,missing:0};for(const row of rows) counts[row.status]++;
  return {format:'vocab-sense-lesson-coverage',version:1,checkedAt:new Date().toISOString(),total:words.length,counts,
    complete:words.length>0&&counts.reviewed===words.length,
    expectedTotal:1600,fullCurriculumComplete:words.length===1600&&counts.reviewed===1600,
    note:'Reviewed means the recorded editorial review passed; structural coverage alone is not a teacher audit. Historic etymology is only applicable where evidence supports it.',words:rows};
}
if(isMain(import.meta.url)) cli(()=>{
  const a=args(),report=lessonStatus(dbArg(a),typeof a.directory==='string'?a.directory:undefined);
  if(typeof a.out==='string') {atomicJson(a.out,report);return {total:report.total,counts:report.counts,complete:report.complete,report:a.out};}
  return report;
});
