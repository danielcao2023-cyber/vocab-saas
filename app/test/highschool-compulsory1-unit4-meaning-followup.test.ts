import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {createLessonReader,defaultLessonDir,validateLesson} from '../server/src/lessons';
it('validates and reads five sourced textbook meanings and examples', () => {
 const rows = [
  [1806,'affect','（疾病）侵袭；影响健康','The disease affects the lungs.'],
  [1836,'crash','撞车；碰撞事故（名词）','Nobody was hurt in the crash.'],
  [1839,'strike','袭击；攻击（名词）','The air strike damaged the bridge.'],
  [1826,'erupt','（火山）喷发','The volcano erupted lava during the night.'],
  [1804,'evacuate','疏散；撤离','When the alarm sounded, everyone evacuated safely.']
 ] as const;
 const read=createLessonReader();
 for(const [id,headword,title,en] of rows){
  const word={id,headword};const raw=JSON.parse(readFileSync(join(defaultLessonDir,`${id}.json`),'utf8'));
  const valid=validateLesson(raw,word);expect(valid,`${headword}: ${JSON.stringify(valid)}`).toMatchObject({ok:true});
  const result=read(word);expect(result.status,headword).toBe('ready');
  expect(result.lesson?.senses.find(s=>s.title===title)?.examples.some(e=>e.en===en),headword).toBe(true);
 }
});
