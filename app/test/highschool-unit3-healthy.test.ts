import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';
it('provides reviewed Unit 3 healthy-living vocabulary', () => {
  const read=createLessonReader();
  for (const [id,headword] of [[1781,'million'],[1782,'audience'],[1783,'make a difference'],[1784,'rather than'],[1785,'push-up'],[1786,'cut ... out']] as const) expect(read({id,headword}).status,headword).toBe('ready');
  for (const word of ['million','audience','push-up']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
