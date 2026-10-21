import {newAnswerId} from './pending';
import type {ExposureInput} from '../../shared/learning';
interface Navigation {exitWordId?:number;enterWordId?:number;commit:()=>void}
/** Reading is durable before revealing a lesson or resuming a question. */
export class LessonNavigation {
 private pending:{events:ExposureInput[];commit:()=>void}|null=null;private running=false;
 constructor(private save:(body:ExposureInput)=>Promise<unknown>,private id:()=>string=newAnswerId){}
 async run(action:Navigation){if(this.pending||this.running)return false;const events:ExposureInput[]=[];if(action.exitWordId)events.push({policyVersion:3,wordId:action.exitWordId,eventId:this.id(),reason:'lesson_exit'});if(action.enterWordId)events.push({policyVersion:3,wordId:action.enterWordId,eventId:this.id(),reason:'lesson_enter'});this.pending={events,commit:action.commit};return this.retry();}
 async retry(){if(!this.pending||this.running)return false;this.running=true;try{while(this.pending.events.length){await this.save(this.pending.events[0]);this.pending.events.shift();}const commit=this.pending.commit;this.pending=null;commit();return true;}catch{return false;}finally{this.running=false;}}
}
