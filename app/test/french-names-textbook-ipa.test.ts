import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
 [1, 'Jean Anthelme Brillat-Savarin', '教材标注：Jean /ʒɑ̃ːn/；Anthelme /ˈænθəlm/；Brillat-Savarin /ˈbrɪlæ ˈsævərən/'],
 [1, 'Jean-Philippe', '教材标注：/ˈʒɑ̃ːn ˈfɪlɪp/'],
])('shows textbook transcription for %s %s', (id, headword, ipa) => {
 const word={id,headword}, result=read(word);expect(result.status).toBe('ready');
 if(result.status!=='ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson,word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa,result.lesson.pronunciation.uk,result.lesson.pronunciation.us]).toEqual([ipa,'','']);
 expect(result.lesson.takeaway).toContain('法语读音可能不同');
 expect(result.lesson.forms[0].ipa).toBe(ipa);
 expect(result.lesson.pronunciation.sourceIds).toContain('textbook-ipa');
});
