import type {DB} from './db.ts';
import {HttpError} from './http-error.ts';
import {shDay} from './time.ts';
import {learningWords} from './learning/selection.ts';
import {DEFAULT_PREFERENCES,PLAYBACK_RATES,type StudyPreferences,type PreferencesResponse} from '../../shared/preferences.ts';
const KEY='study_preferences';
interface Stored {preferences:StudyPreferences;previousDailyWordLimit:number;effectiveOn:string|null}
function validate(value:unknown):StudyPreferences {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new HttpError(400,'设置格式无效。');
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==3||Object.keys(v).some(k=>!['dailyWordLimit','playbackRate','dictationAutoPlay'].includes(k))
  ||typeof v.dailyWordLimit!=='number'||!Number.isInteger(v.dailyWordLimit)||v.dailyWordLimit<5||v.dailyWordLimit>100
  ||typeof v.playbackRate!=='number'||!PLAYBACK_RATES.some(rate=>rate===v.playbackRate)||typeof v.dictationAutoPlay!=='boolean')throw new HttpError(400,'每日词量须为5—100的整数，请选择可用的录音速度和自动播放设置。');
 return {dailyWordLimit:v.dailyWordLimit,playbackRate:v.playbackRate,dictationAutoPlay:v.dictationAutoPlay};
}
function stored(db:DB):Stored {
 const row=db.prepare('SELECT value FROM settings WHERE key=?').get(KEY) as {value:string}|undefined;
 try{if(row){const v=JSON.parse(row.value);const preferences=validate(v.preferences);if(!Number.isInteger(v.previousDailyWordLimit)||v.previousDailyWordLimit<5||v.previousDailyWordLimit>100||!(v.effectiveOn===null||typeof v.effectiveOn==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.effectiveOn)))throw Error('Invalid stored preferences');return {preferences,previousDailyWordLimit:v.previousDailyWordLimit,effectiveOn:v.effectiveOn};}}catch{/* Invalid preferences fall back without exposing unrelated settings. */}
 return {preferences:{...DEFAULT_PREFERENCES},previousDailyWordLimit:40,effectiveOn:null};
}
function active(v:Stored,now:Date){return v.effectiveOn&&shDay(now)<v.effectiveOn?v.previousDailyWordLimit:v.preferences.dailyWordLimit;}
export function dailyWordLimit(db:DB,now:Date){return active(stored(db),now);}
export function readUserSettings(db:DB,now:Date):PreferencesResponse {
 const v=stored(db);return {preferences:v.preferences,activeDailyWordLimit:active(v,now),dailyLimitEffectiveOn:v.effectiveOn&&shDay(now)<v.effectiveOn?v.effectiveOn:null,wordCount:learningWords(db).length};
}
export function saveUserSettings(db:DB,input:unknown,now:Date):PreferencesResponse {return db.transaction(()=>{
 const preferences=validate(input),old=stored(db),current=active(old,now),changed=preferences.dailyWordLimit!==old.preferences.dailyWordLimit;
 const next:Stored={preferences,previousDailyWordLimit:changed?current:old.previousDailyWordLimit,effectiveOn:changed?(preferences.dailyWordLimit===current?null:shDay(new Date(+now+86400000))):old.effectiveOn};
 db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(KEY,JSON.stringify(next));return readUserSettings(db,now);
})();}
