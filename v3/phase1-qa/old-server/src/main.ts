import { openDb } from './db.ts';
import { buildApp } from './app.ts';
import { ConfigError, parseCidrs, parseHosts, parsePort, startListeners } from './net.ts';

let hosts: string[], port: number, allow;
try {
  hosts = parseHosts(process.env.HOST);
  port = parsePort(process.env.PORT);
  allow = parseCidrs(process.env.ALLOW_CIDRS);
} catch (e) {
  if (e instanceof ConfigError) { console.error(`配置错误：${e.message}`); process.exit(2); }
  throw e;
}
const db = openDb(process.env.DB_PATH ?? 'data/vocab.db');
const app = buildApp(db, { staticDir: process.env.STATIC_DIR ?? 'dist', allow });
await app.ready();
const listeners = startListeners(hosts, port, (req, res) => app.routing(req, res));
for (const s of ['SIGINT', 'SIGTERM'] as const) process.on(s, async () => { await listeners.close(); await app.close(); db.close(); process.exit(0); });
