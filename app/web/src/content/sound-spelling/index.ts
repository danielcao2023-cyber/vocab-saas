import {governmentSoundSpelling} from './government';
import {coreBatch1} from './core-batch-1';
import type {SoundSpellingLesson} from './types';

/** Only reviewed, committed content is published; draft model files stay outside the app. */
export const soundSpellingLessons: readonly SoundSpellingLesson[] = [governmentSoundSpelling,...coreBatch1];
const lessonsByWord=new Map(soundSpellingLessons.map(lesson=>[lesson.headword,lesson]));

export function getSoundSpellingLesson(headword:string):SoundSpellingLesson|undefined {
 return lessonsByWord.get(headword.trim().toLowerCase());
}
