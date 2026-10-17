import { openDb } from './db.ts';
import { buildApp } from './app.ts';

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? 18420);
const db = openDb(process.env.DB_PATH ?? 'data/vocab.db');
const app = buildApp(db, { staticDir: process.env.STATIC_DIR ?? 'dist' });
app.listen({ host: HOST, port: PORT }).then((addr) => console.log(`vocab app listening on ${addr}`));
for (const s of ['SIGINT', 'SIGTERM'] as const) process.on(s, async () => { await app.close(); db.close(); process.exit(0); });
