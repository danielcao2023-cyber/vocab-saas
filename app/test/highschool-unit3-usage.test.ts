import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';
it('provides reviewed Unit 3 usage and connective lessons', () => {
  const read=createLessonReader();
  for (const [id,headword] of [[1775,'give up'],[1776,'make sense'],[1777,'pretend'],[1778,'pretend to do sth.'],[1779,'even if'],[1780,'even though']] as const) expect(read({id,headword}).status,headword).toBe('ready');
  expect(getSoundSpellingLesson('pretend')).toBeDefined();
});
