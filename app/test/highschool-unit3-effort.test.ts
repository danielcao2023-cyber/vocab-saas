import { expect, it } from 'vitest';
import { createLessonReader } from '../server/src/lessons';
import { getSoundSpellingLesson } from '../web/src/content/sound-spelling';
it('provides reviewed Unit 3 effort vocabulary', () => {
  const read = createLessonReader();
  for (const [id, headword] of [[1769,'injury'],[1770,'captain'],[1771,'lose heart'],[1772,'graceful'],[1773,'strength'],[1774,'failure']] as const) expect(read({id,headword}).status,headword).toBe('ready');
  for (const word of ['injury','captain','graceful','strength','failure']) expect(getSoundSpellingLesson(word),word).toBeDefined();
});
