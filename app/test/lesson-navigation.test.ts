import {expect,it} from 'vitest';
import {LessonNavigation} from '../web/src/lesson-navigation';
it('blocks navigation until both exposures are saved and retries their original IDs',async()=>{
 const calls:any[]=[],commits:string[]=[];let fail=true,n=0;
 const nav=new LessonNavigation(async b=>{calls.push(b);if(fail)throw new Error('disk full');},()=>String(++n));
 expect(await nav.run({exitWordId:1,enterWordId:2,commit:()=>commits.push('open')})).toBe(false);expect(commits).toEqual([]);
 fail=false;expect(await nav.retry()).toBe(true);expect(calls[0].eventId).toBe(calls[1].eventId);expect(calls[2].wordId).toBe(2);expect(commits).toEqual(['open']);
});
