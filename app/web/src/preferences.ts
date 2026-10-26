import {reactive} from 'vue';
import {DEFAULT_PREFERENCES,type StudyPreferences} from '../../shared/preferences';
export const preferences=reactive<StudyPreferences>({...DEFAULT_PREFERENCES});
let revision=0;
export const preferenceRevision=()=>revision;
export function applyPreferences(value:StudyPreferences){Object.assign(preferences,value);revision++;}
