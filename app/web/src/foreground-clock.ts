/** Display-only time. Never used to infer recall, difficulty, or a rating. */
export class ForegroundClock {
 private since:number|null=null;private accumulated=0;
 constructor(private now:()=>number=()=>Date.now()){}
 setActive(active:boolean){if(this.since!==null){this.accumulated+=Math.max(0,this.now()-this.since);this.since=null;}if(active)this.since=this.now();}
 reset(active:boolean){this.accumulated=0;this.since=active?this.now():null;}
 elapsed(){const n=this.accumulated+(this.since===null?0:Math.max(0,this.now()-this.since));return Number.isFinite(n)?Math.min(300000,n):undefined;}
}
