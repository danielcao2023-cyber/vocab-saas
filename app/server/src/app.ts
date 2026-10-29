import {canonicalLessonId} from './lesson-identity.ts';
import {displayHeadword} from './display-headword.ts';
import {evidenceVersion} from './learning/evidence-migration.ts';
import { search, wordDetail, browse } from './search.ts';
import { learningRoutes } from './learning/routes.ts';
import { getContent, contentFeedback } from './content.ts';
import { sendError, parseId, HttpError } from './http-error.ts';
import { feedbackLimiter, LIMIT_ERRORS } from './rate-limit.ts';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';
import path from 'node:path';
import type { DB } from './db.ts';
import { issueQuestion, answerQuestion, hasOpenQuestion, QuizError, type Rng, type Context } from './quiz.ts';
import { streak, makeup, parentSummary, curriculumProgress, queueStateAt, shiftDay } from './stats.ts';
import { shDay } from './time.ts';
import type { BlockList } from 'node:net';
import { isAllowed } from './net.ts';
import { readVersion } from './version.ts';
import { checkSpelling, practiceAllowed, nextCard, progress, review, setWrong, todaySummary, wrongSummary, wrongPractice } from './study.ts';
import { pronunciationRoutes } from './pronunciation.ts';
import { createLessonReader } from './lessons.ts';
import {readUserSettings,saveUserSettings} from './user-settings.ts';
import {readVocabularyState} from './vocabulary-selection.ts';

export function buildApp(db: DB, opts: { staticDir?: string; pronunciationDir?: string; lessonDir?: string; now?: () => Date; allow?: BlockList; rng?: Rng } = {}) {
  const now = opts.now ?? (() => new Date());
  const version = readVersion(opts.staticDir ?? 'dist'); // 启动时读一次
  const app = Fastify({ logger: false });
  const limiter = feedbackLimiter();
  const readLesson = createLessonReader(opts.lessonDir);
  const replayed = (answerId: unknown) => typeof answerId === 'string' && !!answerId && !!db.prepare('SELECT 1 FROM review_logs WHERE answer_id=?').get(answerId);
  if (opts.allow) {
    const allow = opts.allow;
    app.addHook('onRequest', async (req, reply) => {
      if (!isAllowed(allow, req.socket.remoteAddress)) return reply.code(403).send({ error: 'forbidden' });
    });
  }

  // 查询参数只接受单个字符串：重复（?q=go&q=went）或数组形式一律 400，不进入业务代码、不外露内部错误。
  app.addHook('preValidation', async (req, reply) => {
    const q = req.query as Record<string, unknown> | undefined;
    if (q && typeof q === 'object' && (Object.values(q).some(v => typeof v !== 'string') || Object.keys(q).some(k => /[[\]]/.test(k)))) return reply.code(400).send({ error: 'invalid query' });
  });
  app.get('/health', async () => {
    db.prepare('SELECT 1').get();
    return { ok: true, commit: version.commit, time: new Date().toISOString(), words: (db.prepare('SELECT COUNT(*) n FROM words').get() as { n: number }).n };
  });
  app.get('/version', async () => version);
  app.get('/api/settings',(_req,reply)=>{reply.header('cache-control','no-store');return readUserSettings(db,now());});
  app.get('/api/vocabulary',(_req,reply)=>{reply.header('cache-control','no-store');return readVocabularyState(db,now());});
  app.post('/api/settings',(req,reply)=>{reply.header('cache-control','no-store');try{if(req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.headers.host}`)throw new HttpError(403,'请从本应用页面修改设置。');return saveUserSettings(db,req.body,now());}catch(e){return sendError(reply,e);}});
  pronunciationRoutes(app, db, opts.pronunciationDir);
  learningRoutes(app, db, now);
  app.get('/api/today', async () => {
    const t = now(), p = parentSummary(db, t, 1);
    return { ...todaySummary(db, t), stats: p.daily[0], masteredNew: (db.prepare('SELECT mastered_new FROM daily_stats WHERE day=?').get(shDay(t)) as { mastered_new: number } | undefined)?.mastered_new ?? 0,
      tomorrowReview: queueStateAt(db, new Date(shiftDay(shDay(t), 1) + 'T00:00:00+08:00')).review,
      comparison: p.totals.previousWeek.answers ? { thisWeek: p.totals.thisWeek, previousWeek: p.totals.previousWeek } : null };
  });
  app.get<{ Querystring: { prefer?: 'review' | 'new' } }>('/api/next', async (req) => { const t = now(); const card = nextCard(db, t, req.query.prefer === 'new' ? 'new' : 'review'); return { card, question: card ? issueQuestion(db, card, t, 'study', opts.rng) : null }; });
  app.post<{ Body: { cardId: number; rating: number; durationMs?: number; answerId?: string; context?: Context } }>('/api/review', async (req, reply) => {
    if(evidenceVersion(db)===3)return reply.code(409).send({error:'请使用 /api/learning 新版背词入口。'});
    const { cardId, rating, durationMs, answerId, context } = req.body ?? ({} as any);
    const t = now();
    // 重试已存过的 answerId 直接走幂等返回
    if (!replayed(answerId)) {
      // 选择题必须由服务端判分：这张卡今天有任何 context 下未作答的选择题，都不接受翻面自评
      if (hasOpenQuestion(db, Number(cardId), undefined, t)) return reply.code(409).send({ ok: false, error: 'question pending: answer via /api/answer' });
      if (context === 'practice' && !practiceAllowed(db, Number(cardId), t)) return reply.code(409).send({ ok: false, error: 'practice only for wrong-book words' });
    }
    try { const r = review(db, Number(cardId), Number(rating) as any, t, { durationMs, answerId, context, qtype: 'flip' }); return { ok: true, due: r.card.due.toISOString(), state: r.card.state, duplicate: r.duplicate }; }
    catch (e) { return reply.code(400).send({ ok: false, error: (e as Error).message }); }
  });
  app.post<{ Body: { cardId: number; answer: string; usedHint?: boolean; answerId?: string; durationMs?: number; context?: Context } }>('/api/check', async (req, reply) => {
    if(evidenceVersion(db)===3)return reply.code(409).send({error:'请使用 /api/learning 新版背词入口。'});
    const { cardId, answer, usedHint, answerId, durationMs, context } = req.body ?? ({} as any);
    if (context === 'practice' && !replayed(answerId) && !practiceAllowed(db, Number(cardId), now())) return reply.code(409).send({ ok: false, error: 'practice only for wrong-book words' });
    try { return { ok: true, ...checkSpelling(db, Number(cardId), String(answer ?? ''), now(), !!usedHint, answerId, { context, durationMs }) }; }
    catch (e) { return reply.code(400).send({ ok: false, error: (e as Error).message }); }
  });
  app.get<{Querystring:{q?:string;limit?:string}}>('/api/search',async(req,reply)=>{
    try {const raw=req.query.limit??'20',limit=Number(raw);if(!/^[1-9]\d*$/.test(raw)||limit>100)throw new HttpError(400,'invalid limit');return search(db,req.query.q??'',limit);}catch(e){return sendError(reply,e);}
  });
  app.get<{Params:{id:string}}>('/api/word/:id',async(req,reply)=>{try{return wordDetail(db,parseId(req.params.id))??reply.code(404).send({error:'word not found'});}catch(e){return sendError(reply,e);}});
  app.get<{Params:{id:string}}>('/api/word/:id/content',async(req,reply)=>{try{const id=parseId(req.params.id);if(!db.prepare('SELECT 1 FROM words WHERE id=?').get(id))return reply.code(404).send({error:'word not found'});return getContent(db,id);}catch(e){return sendError(reply,e);}});
  app.get<{Params:{id:string}}>('/api/word/:id/lesson',async(req,reply)=>{try{const id=parseId(req.params.id);const word=db.prepare('SELECT id,headword FROM words WHERE id=?').get(id) as {id:number;headword:string}|undefined;if(!word)return reply.code(404).send({error:'word not found'});const shown=displayHeadword(db,word.id,word.headword);let result=readLesson(shown!==word.headword?{...word,keyedName:'highschool-log.json'}:word);if(result.status!=='ready'&&shown===word.headword){const canonical=canonicalLessonId(db,word);if(canonical!==undefined&&canonical!==word.id){const fallback=readLesson({...word,id:canonical});if(fallback.status==='ready')result={...fallback,lesson:{...fallback.lesson,wordId:word.id}};}}return result.status==='ready'?{...result,lesson:{...result.lesson,headword:shown}}:result;}catch(e){return sendError(reply,e);}});
  app.get<{Querystring:Record<string,string|undefined>}>('/api/browse',async(req,reply)=>{try{return browse(db,req.query);}catch(e){return sendError(reply,e);}});
  app.post<{Params:{contentId:string};Body:{reason:string}}>('/api/content/:contentId/feedback',async(req,reply)=>{const t=now(),limited=limiter.check(t);if(limited)return reply.code(429).send({error:LIMIT_ERRORS[limited],scope:limited});try{const r=contentFeedback(db,parseId(req.params.contentId,'content id'),req.body?.reason,t);limiter.hid(t);return r;}catch(e){return sendError(reply,e);}});
  app.get('/api/progress', async () => ({ lists: progress(db), curriculum: curriculumProgress(db) }));
  app.get<{ Querystring: { sort?: string } }>('/api/wrong', async req => wrongSummary(db, req.query.sort === 'recent' ? 'recent' : 'count', now()));
  app.get<{ Querystring: { sort?: string } }>('/api/wrong/practice', async req => wrongPractice(db, 10, now(), opts.rng, req.query.sort === 'recent' ? 'recent' : 'count'));
  app.post<{ Params: { wordId: string }; Body: { inBook: boolean } }>('/api/wrong/:wordId', async (req) => {
    setWrong(db, Number(req.params.wordId), !!req.body?.inBook, now()); return { ok: true };
  });

  app.post<{ Body: { questionId: number; choiceWordId: number; durationMs?: number; answerId: string } }>('/api/answer', async (req, reply) => {
    if(evidenceVersion(db)===3)return reply.code(409).send({error:'请使用 /api/learning 新版背词入口。'});
    const b = req.body ?? {};
    try { return answerQuestion(db, Number(b.questionId), Number(b.choiceWordId), b.answerId, now(), b.durationMs); }
    catch (e) { return reply.code(e instanceof QuizError ? e.status : 400).send({ ok: false, error: (e as Error).message }); }
  });
  app.get<{ Querystring: { month?: string } }>('/api/streak', async (req, reply) => {
    try { return streak(db, now(), req.query.month); }
    catch (e) { return reply.code(400).send({ error: (e as Error).message }); }
  });
  app.post<{ Body: { day: string } }>('/api/streak/makeup', async (req, reply) => {
    try { return makeup(db, String(req.body?.day ?? ''), now()); }
    catch (e) { return reply.code(400).send({ error: (e as Error).message }); }
  });
  app.get<{ Querystring: { days?: string } }>('/api/parent/summary', async (req, reply) => {
    try { return parentSummary(db, now(), req.query.days === undefined ? 30 : Number(req.query.days)); }
    catch (e) { return reply.code(400).send({ error: (e as Error).message }); }
  });

  if (opts.staticDir && fs.existsSync(opts.staticDir)) {
    app.register(fastifyStatic, { root: path.resolve(opts.staticDir) });
    app.setNotFoundHandler((req, reply) => req.url.startsWith('/api') ? reply.code(404).send({ error: 'not found' }) : reply.sendFile('index.html'));
  }
  return app;
}
