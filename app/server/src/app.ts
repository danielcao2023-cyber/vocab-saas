import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';
import path from 'node:path';
import type { DB } from './db.ts';
import type { BlockList } from 'node:net';
import { isAllowed } from './net.ts';
import { checkSpelling, nextCard, progress, review, setWrong, todaySummary, wrongList, wrongPractice } from './study.ts';

export function buildApp(db: DB, opts: { staticDir?: string; now?: () => Date; allow?: BlockList } = {}) {
  const now = opts.now ?? (() => new Date());
  const app = Fastify({ logger: false });
  if (opts.allow) {
    const allow = opts.allow;
    app.addHook('onRequest', async (req, reply) => {
      if (!isAllowed(allow, req.socket.remoteAddress)) return reply.code(403).send({ error: 'forbidden' });
    });
  }

  app.get('/health', async () => {
    db.prepare('SELECT 1').get();
    return { ok: true, time: new Date().toISOString(), words: (db.prepare('SELECT COUNT(*) n FROM words').get() as { n: number }).n };
  });
  app.get('/api/today', async () => todaySummary(db, now()));
  app.get<{ Querystring: { prefer?: 'review' | 'new' } }>('/api/next', async (req) => ({ card: nextCard(db, now(), req.query.prefer === 'new' ? 'new' : 'review') }));
  app.post<{ Body: { cardId: number; rating: number; durationMs?: number } }>('/api/review', async (req, reply) => {
    const { cardId, rating, durationMs } = req.body ?? ({} as any);
    try { const c = review(db, Number(cardId), Number(rating) as any, now(), { durationMs }); return { ok: true, due: c.due.toISOString(), state: c.state }; }
    catch (e) { return reply.code(400).send({ ok: false, error: (e as Error).message }); }
  });
  app.post<{ Body: { cardId: number; answer: string; usedHint?: boolean } }>('/api/check', async (req, reply) => {
    const { cardId, answer, usedHint } = req.body ?? ({} as any);
    try { return { ok: true, ...checkSpelling(db, Number(cardId), String(answer ?? ''), now(), !!usedHint) }; }
    catch (e) { return reply.code(400).send({ ok: false, error: (e as Error).message }); }
  });
  app.get('/api/progress', async () => ({ lists: progress(db) }));
  app.get('/api/wrong', async () => ({ items: wrongList(db) }));
  app.get('/api/wrong/practice', async () => ({ cards: wrongPractice(db) }));
  app.post<{ Params: { wordId: string }; Body: { inBook: boolean } }>('/api/wrong/:wordId', async (req) => {
    setWrong(db, Number(req.params.wordId), !!req.body?.inBook, now()); return { ok: true };
  });

  if (opts.staticDir && fs.existsSync(opts.staticDir)) {
    app.register(fastifyStatic, { root: path.resolve(opts.staticDir) });
    app.setNotFoundHandler((req, reply) => req.url.startsWith('/api') ? reply.code(404).send({ error: 'not found' }) : reply.sendFile('index.html'));
  }
  return app;
}
