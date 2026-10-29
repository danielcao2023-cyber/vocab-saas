import {guardLegacyAudioIssue} from './audio-compat.ts';
import {evidenceVersion} from './evidence-migration.ts';
import {learningViews} from './evidence-views.ts';
import {saveExposure} from './evidence-store.ts';
import type {LearningView,ExposureInput} from '../../../shared/learning.ts';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {DB} from '../db.ts';
import {HttpError,sendError} from '../http-error.ts';
import {learningToday,startLearning,nextLearning,answerLearning,consultLearning,deferLearning,learningBooks} from './engine.ts';
import type {LearningAnswer,WordBook} from '../../../shared/learning.ts';
function checkOrigin(req:FastifyRequest){if(req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.headers.host}`)throw new HttpError(403,'请从本应用页面开始学习。');}
export function learningRoutes(app:FastifyInstance,db:DB,now:()=>Date){
 const requireV3=(body:any)=>{if(evidenceVersion(db)===3&&body?.policyVersion!==3)throw new HttpError(409,'请刷新后使用新版学习入口。');if(body&&['rating','nextDue','stage','eligible'].some(k=>k in body))throw new HttpError(400,'不能自报记忆评分。');};
 const run=(reply:any,fn:()=>unknown)=>{reply.header('cache-control','no-store');try{return fn();}catch(e){return sendError(reply,e,500);}};
 app.get<{Querystring:{view?:string;page?:string}}>('/api/learning/views',(req,reply)=>run(reply,()=>{const page=req.query.page??'1';if(!/^[1-9]\d*$/.test(page))throw new HttpError(400,'页码无效。');return learningViews(db,(req.query.view??'all') as LearningView,Number(page),now());}));
 app.post('/api/learning/exposure',(req,reply)=>run(reply,()=>{checkOrigin(req);requireV3(req.body);if(evidenceVersion(db)!==3)throw new HttpError(409,'尚未启用新版学习。');saveExposure(db,req.body as ExposureInput,now());return {ok:true};}));
 app.get('/api/learning/today',(_req,reply)=>run(reply,()=>learningToday(db,now())));
 app.post('/api/learning/start',(req,reply)=>run(reply,()=>{checkOrigin(req);requireV3(req.body);return startLearning(db,now());}));
 app.get('/api/learning/next',(req,reply)=>run(reply,()=>nextLearning(db,now(),req.headers['x-audio-variants']==='1')));
 app.post('/api/learning/answer',(req,reply)=>run(reply,()=>{checkOrigin(req);requireV3(req.body);guardLegacyAudioIssue(db,(req.body as any)?.issueId,req.headers['x-audio-variants']==='1');return answerLearning(db,req.body as LearningAnswer,now());}));
 app.post('/api/learning/consult',(req,reply)=>run(reply,()=>{checkOrigin(req);requireV3(req.body);guardLegacyAudioIssue(db,(req.body as any)?.issueId,req.headers['x-audio-variants']==='1');return consultLearning(db,evidenceVersion(db)===3?req.body:(req.body as any)?.issueId,now());}));
 app.post('/api/learning/defer',(req,reply)=>run(reply,()=>{checkOrigin(req);requireV3(req.body);guardLegacyAudioIssue(db,(req.body as any)?.issueId,req.headers['x-audio-variants']==='1');return deferLearning(db,(req.body as any)?.issueId,now());}));
 app.get<{Querystring:{book?:string;page?:string}}>('/api/learning/books',(req,reply)=>run(reply,()=>{const page=req.query.page??'1';if(!/^[1-9]\d*$/.test(page))throw new HttpError(400,'页码无效。');return learningBooks(db,(req.query.book??'unfamiliar') as WordBook,Number(page),now());}));
}
