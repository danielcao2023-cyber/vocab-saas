import {afterEach,expect,it} from 'vitest';
import {openDb,type DB} from '../server/src/db';
import {buildApp} from '../server/src/app';
const pending:(()=>Promise<void>)[]=[];afterEach(async()=>{for(const close of pending.splice(0))await close();});
function setup(){const db=openDb(':memory:');db.prepare("INSERT INTO words(id,headword,meaning_zh,source,level,priority) VALUES (1,'above','在上方','kb2022','三级',2)").run();let time=new Date('2026-10-20T09:00:00+08:00');const app=buildApp(db,{now:()=>time});pending.push(async()=>{await app.close();db.close();});return {app,db,advance:()=>time=new Date(time.getTime()+20*60000)};}
it('starts and resumes real cards, grades on the server, retries once and exposes consistent book counts',async()=>{
 const {app,db,advance}=setup();expect((await app.inject('/api/learning/today')).json()).toMatchObject({started:false,total:1});
 expect((await app.inject({method:'POST',url:'/api/learning/start',headers:{origin:'https://other.example'},payload:{}})).statusCode).toBe(403);
 expect((await app.inject({method:'POST',url:'/api/learning/start',payload:{}})).statusCode).toBe(200);
 let first='';for(let i=0;i<9;i++){
  const turn=(await app.inject('/api/learning/next')).json();expect(turn.kind).toBe('card');if(!i)first=turn.card.issueId;
  const payload={issueId:turn.card.issueId,answerId:'answer-'+i,...(turn.card.mode==='recognize'?{choiceId:1}:{answer:'above'})};
  const saved=await app.inject({method:'POST',url:'/api/learning/answer',payload});expect(saved.statusCode).toBe(200);expect(saved.json().correct).toBe(true);
  expect((await app.inject({method:'POST',url:'/api/learning/answer',payload})).json()).toEqual(saved.json());advance();
 }
 expect((db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n).toBe(9);
 expect((await app.inject('/api/learning/books?book=mastered')).json()).toMatchObject({total:1});
 expect((await app.inject('/api/word/1')).json().status).toBe('已掌握');
 expect((await app.inject('/api/browse?status=mastered')).json().total).toBe(1);
 expect((await app.inject({method:'POST',url:'/api/learning/answer',payload:{issueId:first,answerId:'collision',choiceId:1}})).statusCode).toBe(409);
});
it('rejects non-offered answers, invalid books and audio deferral on non-listening cards',async()=>{
 const {app,db}=setup();await app.inject({method:'POST',url:'/api/learning/start',payload:{}});const card=(await app.inject('/api/learning/next')).json().card;
 expect((await app.inject({method:'POST',url:'/api/learning/answer',payload:{issueId:card.issueId,answerId:'bad',choiceId:999}})).statusCode).toBe(400);
 expect((await app.inject({method:'POST',url:'/api/learning/defer',payload:{issueId:card.issueId}})).statusCode).toBe(400);
 expect((await app.inject('/api/learning/books?book=other')).statusCode).toBe(400);expect((db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n).toBe(0);
});
