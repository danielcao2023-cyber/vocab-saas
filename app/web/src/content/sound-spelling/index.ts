import {highschoolUnit3Initial} from './highschool-unit3-initial';
import {governmentSoundSpelling} from './government';
import {highschoolUnit2Initial} from './highschool-unit2-initial';
import {highschoolUnit2Next} from './highschool-unit2-next';
import {highschoolUnit2Travel} from './highschool-unit2-travel';
import {highschoolUnit2Culture} from './highschool-unit2-culture';
import {highschoolUnit2Economy} from './highschool-unit2-economy';
import {highschoolUnit2Check} from './highschool-unit2-check';
import {highschoolUnit2History} from './highschool-unit2-history';
import {highschoolUnit2Places} from './highschool-unit2-places';
import {highschoolUnit1} from './highschool-unit1';
import {coreBatch1} from './core-batch-1';
import {expandedA} from './expanded-a';
import {expandedB} from './expanded-b';
import {expandedC} from './expanded-c';
import {mainHeadwords} from '../../../../server/src/text';
import type {SoundSpellingLesson} from './types';

/** Only reviewed, committed content is published; draft model files stay outside the app. */
export const soundSpellingLessons: readonly SoundSpellingLesson[] = [governmentSoundSpelling,...coreBatch1,...expandedA,...expandedB,...expandedC,...highschoolUnit1,...highschoolUnit2Initial,...highschoolUnit2Next,...highschoolUnit2Travel,...highschoolUnit2Culture,...highschoolUnit2Economy,...highschoolUnit2Check,...highschoolUnit2History,...highschoolUnit2Places,...highschoolUnit3Initial];
const lessonsByWord=new Map(soundSpellingLessons.map(lesson=>[lesson.headword.toLowerCase(),lesson]));

export function getSoundSpellingLessons(headword:string):SoundSpellingLesson[] {
 return [...new Set(mainHeadwords(headword).flatMap(word=>{
  const lesson=lessonsByWord.get(word.trim().toLowerCase());
  return lesson?[lesson]:[];
 }))];
}

export function getSoundSpellingLesson(headword:string):SoundSpellingLesson|undefined {
 return getSoundSpellingLessons(headword)[0];
}
