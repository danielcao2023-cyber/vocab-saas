export const PLAYBACK_RATES=[0.75,1,1.25,1.5] as const;
import type {VocabularySelection,VocabularyState} from './vocabulary';
export interface StudyPreferences {dailyWordLimit:number;playbackRate:number;dictationAutoPlay:boolean;vocabulary?:VocabularySelection}
export const DEFAULT_PREFERENCES:StudyPreferences={dailyWordLimit:40,playbackRate:1,dictationAutoPlay:true};
export interface PreferencesResponse {preferences:StudyPreferences;activeDailyWordLimit:number;dailyLimitEffectiveOn:string|null;wordCount:number;vocabulary?:VocabularyState}
