import type {DB} from '../db.ts';
import {HttpError} from '../http-error.ts';
export const legacyHeteronym=(word:string)=>word==='bow'||word==='contract';
export const audioCompatibilityError='此题需要新版页面播放读音，请刷新页面后继续。';
export function guardLegacyAudioIssue(db:DB,id:unknown,supportsVariants:boolean){
 if(supportsVariants||typeof id!=='string')return;
 const issue=db.prepare("SELECT audio_variant FROM learning_issues WHERE id=? AND mode='dictation' AND answered_at IS NULL").get(id) as {audio_variant:string|null}|undefined;
 if(issue?.audio_variant==='verb')throw new HttpError(409,audioCompatibilityError);
}
