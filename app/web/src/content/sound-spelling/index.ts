import {governmentSoundSpelling} from './government';
import {highschoolUnit1} from './highschool-unit1';
import {coreBatch1} from './core-batch-1';
import {expandedA} from './expanded-a';
import {expandedB} from './expanded-b';
import {expandedC} from './expanded-c';
import {mainHeadwords} from '../../../../server/src/text';
import type {SoundSpellingLesson} from './types';

/** Only reviewed, committed content is published; draft model files stay outside the app. */
export const soundSpellingLessons: readonly SoundSpellingLesson[] = [governmentSoundSpelling,...coreBatch1,...expandedA,...expandedB,...expandedC,...highschoolUnit1];
const lessonsByWord=new Map(soundSpellingLessons.map(lesson=>[lesson.headword,lesson]));

export function getSoundSpellingLessons(headword:string):SoundSpellingLesson[] {
 return [...new Set(mainHeadwords(headword).flatMap(word=>{
  const lesson=lessonsByWord.get(word.trim().toLowerCase());
  return lesson?[lesson]:[];
 }))];
}

export function getSoundSpellingLesson(headword:string):SoundSpellingLesson|undefined {
 return getSoundSpellingLessons(headword)[0];
}
