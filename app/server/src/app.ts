import { search, wordDetail, browse } from './search.ts';
import { getContent, contentFeedback } from './content.ts';
import { sendError, parseId } from './http-error.ts';
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

export function buildApp(db: DB, opts: { staticDir?: string; now?: () => Date; allow?: BlockList; rng?: Rng } = {}) {
  const now = opts.now ?? (() => new Date());
  const version = readVersion(opts.staticDir ?? 'dist'); // 启动时读一次
  const app = Fastify({ logger: false });
  const replayed = (answerId: unknown) => typeof answerId === 'string' && !!answerId && !!db.prepare('SELECT 1 FROM review_logs WHERE answer_id=?').get(answerId);
  if (opts.allow) {
    const allow = opts.allow;
    app.addHook('onRequest', async (req, reply) => {
      if (!isAllowed(allow, req.socket.remoteAddress)) return reply.code(403).send({ error: 'forbidden' });
    });
  }

  app.get('/health', async () => {
    db.prepare('SELECT 1').get();
    return { ok: true, commit: version.commit, time: new Date().toISOString(), words: (db.prepare('SELECT COUNT(*) n FROM words').get() as { n: number }).n };
  });
  app.get('/version', async () => version);
  app.get('/api/today', async () => {
    const t = now(), p = parentSummary(db, t, 1);
    return { ...todaySummary(db, t), stats: p.daily[0], masteredNew: (db.prepare('SELECT mastered_new FROM daily_stats WHERE day=?').get(shDay(t)) as { mastered_new: number } | undefined)?.mastered_new ?? 0,
      tomorrowReview: queueStateAt(db, new Date(shiftDay(shDay(t), 1) + 'T00:00:00+08:00')).review,
      comparison: p.totals.previousWeek.answers ? { thisWeek: p.totals.thisWeek, previousWeek: p.totals.previousWeek } : null };
  });
  app.get<{ Querystring: { prefer?: 'review' | 'new' } }>('/api/next', async (req) => { const t = now(); const card = nextCard(db, t, req.query.prefer === 'new' ? 'new' : 'review'); return { card, question: card ? issueQuestion(db, card, t, 'study', opts.rng) : null }; });
  app.post<{ Body: { cardId: number; rating: number; durationMs?: number; answerId?: string; context?: Context } }>('/api/review', async (req, reply) => {
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
    const { cardId, answer, usedHint, answerId, durationMs, context } = req.body ?? ({} as any);
    if (context === 'practice' && !replayed(answerId) && !practiceAllowed(db, Number(cardId), now())) return reply.code(409).send({ ok: false, error: 'practice only for wrong-book words' });
    try { return { ok: true, ...checkSpelling(db, Number(cardId), String(answer ?? ''), now(), !!usedHint, answerId, { context, durationMs }) }; }
    catch (e) { return reply.code(400).send({ ok: false, error: (e as Error).message }); }
  });
  app.get<{Querystring:{q?:string;limit?:string}}>('/api/search',async(req,reply)=>{
    try {const limit=Number(req.query.limit??20);if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('invalid limit');return search(db,req.query.q??'',limit);}catch(e){return reply.code(400).send({error:(e as Error).message});}
  });
  app.get<{Params:{id:string}}>('/api/word/:id',async(req,reply)=>{try{return wordDetail(db,parseId(req.params.id))??reply.code(404).send({error:'word not found'});}catch(e){return sendError(reply,e);}});
  app.get<{Params:{id:string}}>('/api/word/:id/content',async(req,reply)=>{try{const id=parseId(req.params.id);if(!db.prepare('SELECT 1 FROM words WHERE id=?').get(id))return reply.code(404).send({error:'word not found'});return getContent(db,id);}catch(e){return sendError(reply,e);}});
  app.get<{Querystring:Record<string,string|undefined>}>('/api/browse',async(req,reply)=>{try{return browse(db,req.query);}catch(e){return reply.code(400).send({error:(e as Error).message});}});
  app.post<{Params:{contentId:string};Body:{reason:string}}>('/api/content/:contentId/feedback',async(req,reply)=>{try{return contentFeedback(db,parseId(req.params.contentId,'content id'),req.body?.reason,now());}catch(e){return sendError(reply,e);}});
  app.get('/api/progress', async () => ({ lists: progress(db), curriculum: curriculumProgress(db) }));
  app.get<{ Querystring: { sort?: string } }>('/api/wrong', async req => wrongSummary(db, req.query.sort === 'recent' ? 'recent' : 'count', now()));
  app.get<{ Querystring: { sort?: string } }>('/api/wrong/practice', async req => wrongPractice(db, 10, now(), opts.rng, req.query.sort === 'recent' ? 'recent' : 'count'));
  app.post<{ Params: { wordId: string }; Body: { inBook: boolean } }>('/api/wrong/:wordId', async (req) => {
    setWrong(db, Number(req.params.wordId), !!req.body?.inBook, now()); return { ok: true };
  });

  app.post<{ Body: { questionId: number; choiceWordId: number; durationMs?: number; answerId: string } }>('/api/answer', async (req, reply) => {
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
