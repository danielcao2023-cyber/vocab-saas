import {highschoolUnit5Demand} from './highschool-unit5-demand';
import {highschoolUnit5Semester} from './highschool-unit5-semester';
import {highschoolUnit5Era} from './highschool-unit5-era';
import {highschoolUnit5Global} from './highschool-unit5-global';
import {highschoolUnit5Variety} from './highschool-unit5-variety';
import {highschoolUnit5History} from './highschool-unit5-history';
import {highschoolUnit5System} from './highschool-unit5-system';
import {highschoolUnit5Initial} from './highschool-unit5-initial';
import {highschoolUnit4Places} from './highschool-unit4-places';
import {highschoolUnit4Strike} from './highschool-unit4-strike';
import {highschoolUnit4Emergency} from './highschool-unit4-emergency';
import {highschoolUnit4Supplies} from './highschool-unit4-supplies';
import {highschoolUnit4Revival} from './highschool-unit4-revival';
import {highschoolUnit4Recover} from './highschool-unit4-recover';
import {highschoolUnit4Ruins} from './highschool-unit4-ruins';
import {highschoolUnit4Shelter} from './highschool-unit4-shelter';
import {highschoolUnit4Rescue} from './highschool-unit4-rescue';
import {highschoolUnit4Weather} from './highschool-unit4-weather';
import {highschoolUnit3Finish} from './highschool-unit3-finish';
import {highschoolUnit3Healthy} from './highschool-unit3-healthy';
import {highschoolUnit3Usage} from './highschool-unit3-usage';
import {highschoolUnit3Effort} from './highschool-unit3-effort';
import {highschoolUnit3Health} from './highschool-unit3-health';
import {highschoolUnit3Glory} from './highschool-unit3-glory';
import {highschoolUnit3Track} from './highschool-unit3-track';
import {highschoolUnit3Sports} from './highschool-unit3-sports';
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
export const soundSpellingLessons: readonly SoundSpellingLesson[] = [governmentSoundSpelling,...coreBatch1,...expandedA,...expandedB,...expandedC,...highschoolUnit1,...highschoolUnit2Initial,...highschoolUnit2Next,...highschoolUnit2Travel,...highschoolUnit2Culture,...highschoolUnit2Economy,...highschoolUnit2Check,...highschoolUnit2History,...highschoolUnit2Places,...highschoolUnit3Initial,...highschoolUnit3Sports,...highschoolUnit3Track,...highschoolUnit3Glory,...highschoolUnit3Health,...highschoolUnit3Effort,...highschoolUnit3Usage,...highschoolUnit3Healthy,...highschoolUnit3Finish,...highschoolUnit4Weather,...highschoolUnit4Rescue,...highschoolUnit4Shelter,...highschoolUnit4Ruins,...highschoolUnit4Recover,...highschoolUnit4Revival,...highschoolUnit4Supplies,...highschoolUnit4Emergency,...highschoolUnit4Strike,...highschoolUnit4Places,...highschoolUnit5Initial,...highschoolUnit5System,...highschoolUnit5History,...highschoolUnit5Variety,...highschoolUnit5Global,...highschoolUnit5Era,...highschoolUnit5Semester,...highschoolUnit5Demand];
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
