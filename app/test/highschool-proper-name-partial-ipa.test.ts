import { expect, it } from 'vitest';
import { createLessonReader, validateLesson } from '../server/src/lessons.ts';
const read = createLessonReader('data/lessons');
it.each([
 [2606, 'the International Space Station', '名称部分：International Space Station /ˌɪntr̩ˈnæʃn̩əl speɪs ˈsteɪʃn̩/'],
 [2436, "the People's Republic of China", "名称部分：People's Republic of China /ˈpiːpəlz ɹɪˈpʌblɪk əv ˈt͡ʃaɪnə/"],
])('labels the sourced part of %s %s', (id, headword, ipa) => {
 const word = { id, headword }, result = read(word); expect(result.status).toBe('ready');
 if (result.status !== 'ready') throw new Error('missing lesson');
 expect(validateLesson(result.lesson, word).ok).toBe(true);
 expect([result.lesson.pronunciation.ipa, result.lesson.pronunciation.uk, result.lesson.pronunciation.us]).toEqual([ipa, '', '']);
 expect(result.lesson.takeaway).toContain('不含前面的 the');
 expect(result.lesson.pronunciation.sourceIds).toContain('name-pronunciation');
});
