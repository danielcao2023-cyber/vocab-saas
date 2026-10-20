import type {WordLesson} from '../../shared/lesson';
import {mainHeadwords,normalizeQuotes} from '../../server/src/text';

export interface LessonTextPart { text: string; highlighted: boolean }

/** Match whole headwords and explicit inflections, including phrases and punctuation. */
export function lessonWordParts(text: string, lesson: Pick<WordLesson, 'headword' | 'forms'>): LessonTextPart[] {
  const terms = [...new Set([...mainHeadwords(lesson.headword), ...lesson.forms.map(form => form.form)]
    .flatMap(form => form.split(/\s*\/\s*/))
    .map(form => normalizeQuotes(form.trim()))
    .filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!terms.length) return [{text, highlighted: false}];
  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’‘ʼ]"));
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${escaped.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
  const result: LessonTextPart[] = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    const normalized = normalizeQuotes(match[0]);
    const validCase = terms.some(term => term === term.toLowerCase() ? term === normalized.toLowerCase() : term === normalized);
    if (!validCase) continue;
    const start = match.index!;
    if (start > end) result.push({text: text.slice(end, start), highlighted: false});
    result.push({text: match[0], highlighted: true});
    end = start + match[0].length;
  }
  if (end < text.length) result.push({text: text.slice(end), highlighted: false});
  return result.length ? result : [{text, highlighted: false}];
}
