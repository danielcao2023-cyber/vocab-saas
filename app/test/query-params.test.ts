// D5：重复/数组查询参数一律 400 {error:'invalid query'}，不外露内部错误；其他查询参数也检查。
import {it,expect} from 'vitest';
import {buildApp} from '../server/src/app.ts';
import {database,T} from './v3-helpers.ts';
import {snapshot} from './p2-helpers.ts';
const URLS=['/api/search?q=go&q=went','/api/search?q[]=go','/api/search?q=go&limit=5&limit=6','/api/browse?group=zk_high&group=daily_high','/api/browse?letter=a&letter=b','/api/browse?page=1&page=2','/api/browse?size[]=10','/api/browse?level=all&level=core','/api/browse?status=new&status=new',
  '/api/next?prefer=new&prefer=review','/api/wrong?sort=count&sort=recent','/api/wrong/practice?sort=a&sort=b','/api/streak?month=2026-10&month=2026-09','/api/parent/summary?days=7&days=30'];
it.each(URLS)('%s → 400 invalid query, no internal error text, no db change',async url=>{
  const db=database(4),app=buildApp(db,{now:()=>T});try{const before=snapshot(db);const r=await app.inject(url);
    expect(r.statusCode).toBe(400);expect(r.json()).toEqual({error:'invalid query'});expect(r.body).not.toMatch(/is not a function|TypeError|at \w+ \(/);expect(snapshot(db)).toEqual(before);
  }finally{await app.close();db.close();}
});
it('single valid params still work; invalid single values give fixed messages only',async()=>{
  const db=database(4),app=buildApp(db,{now:()=>T});try{
    expect((await app.inject('/api/search?q=word1')).statusCode).toBe(200);expect((await app.inject('/api/browse?group=daily_high&letter=w')).statusCode).toBe(200);
    for(const [url,error] of [['/api/search?q=go&limit=abc','invalid limit'],['/api/search?limit=0','invalid limit'],['/api/search?q='+'a'.repeat(41),'q must be at most 40 characters'],['/api/browse?group=x','invalid browse parameters'],['/api/browse?page=1e2','invalid browse parameters']] as const){
      const r=await app.inject(url);expect(r.statusCode,url).toBe(400);expect(r.json()).toEqual({error});}
  }finally{await app.close();db.close();}
});
