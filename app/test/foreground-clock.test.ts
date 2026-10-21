import {expect,it} from 'vitest';
import {ForegroundClock} from '../web/src/foreground-clock';
it('excludes background/lesson time and resumes without discarding prior foreground work',()=>{let t=0;const c=new ForegroundClock(()=>t);c.reset(true);t=1500;c.setActive(false);t=600000;expect(c.elapsed()).toBe(1500);c.setActive(true);t+=2000;expect(c.elapsed()).toBe(3500);c.reset(false);t+=100;expect(c.elapsed()).toBe(0);});
