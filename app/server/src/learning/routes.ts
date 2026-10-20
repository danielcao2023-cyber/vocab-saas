import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {DB} from '../db.ts';
import {HttpError,sendError} from '../http-error.ts';
import {learningToday,startLearning,nextLearning,answerLearning,consultLearning,deferLearning,learningBooks} from './engine.ts';
import type {LearningAnswer,WordBook} from '../../../shared/learning.ts';
function checkOrigin(req:FastifyRequest){if(req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.headers.host}`)throw new HttpError(403,'请从本应用页面开始学习。');}
export function learningRoutes(app:FastifyInstance,db:DB,now:()=>Date){
 const run=(reply:any,fn:()=>unknown)=>{reply.header('cache-control','no-store');try{return fn();}catch(e){return sendError(reply,e,500);}};
 app.get('/api/learning/today',(_req,reply)=>run(reply,()=>learningToday(db,now())));
 app.post('/api/learning/start',(req,reply)=>run(reply,()=>{checkOrigin(req);return startLearning(db,now());}));
 app.get('/api/learning/next',(_req,reply)=>run(reply,()=>nextLearning(db,now())));
 app.post('/api/learning/answer',(req,reply)=>run(reply,()=>{checkOrigin(req);return answerLearning(db,req.body as LearningAnswer,now());}));
 app.post('/api/learning/consult',(req,reply)=>run(reply,()=>{checkOrigin(req);return consultLearning(db,(req.body as any)?.issueId,now());}));
 app.post('/api/learning/defer',(req,reply)=>run(reply,()=>{checkOrigin(req);return deferLearning(db,(req.body as any)?.issueId,now());}));
 app.get<{Querystring:{book?:string;page?:string}}>('/api/learning/books',(req,reply)=>run(reply,()=>{const page=req.query.page??'1';if(!/^[1-9]\d*$/.test(page))throw new HttpError(400,'页码无效。');return learningBooks(db,(req.query.book??'unfamiliar') as WordBook,Number(page),now());}));
}
