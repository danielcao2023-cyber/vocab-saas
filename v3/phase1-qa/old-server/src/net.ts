import http from 'node:http';
import net from 'node:net';

export class ConfigError extends Error {}

export function parseHosts(v: string | undefined): string[] {
  const hosts = (v ?? '127.0.0.1').split(',').map((s) => s.trim()).filter(Boolean);
  if (!hosts.length) throw new ConfigError('HOST 为空');
  for (const h of hosts) if (!net.isIP(h) && h !== 'localhost') throw new ConfigError(`HOST 不是合法 IP：${h}`);
  return [...new Set(hosts)];
}

export function parsePort(v: string | undefined): number {
  const p = Number(v ?? 18420);
  if (!Number.isInteger(p) || p < 1 || p > 65535) throw new ConfigError(`PORT 不合法：${v}`);
  return p;
}

/** ALLOW_CIDRS：逗号分隔，默认只允许本机 */
export function parseCidrs(v: string | undefined): net.BlockList {
  const list = new net.BlockList();
  const items = (v ?? '127.0.0.1/32,::1/128').split(',').map((s) => s.trim()).filter(Boolean);
  if (!items.length) throw new ConfigError('ALLOW_CIDRS 为空');
  for (const it of items) {
    const [ip, bits] = it.split('/');
    const fam = net.isIP(ip);
    const max = fam === 4 ? 32 : 128;
    const prefix = bits === undefined ? max : Number(bits);
    if (!fam || !Number.isInteger(prefix) || prefix < 0 || prefix > max || (bits !== undefined && !/^\d+$/.test(bits))) throw new ConfigError(`ALLOW_CIDRS 项不合法：${it}`);
    list.addSubnet(ip, prefix, fam === 4 ? 'ipv4' : 'ipv6');
  }
  return list;
}

export function isAllowed(list: net.BlockList, addr: string | undefined): boolean {
  if (!addr) return false;
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return list.check(mapped[1], 'ipv4');
  const fam = net.isIP(addr);
  return fam ? list.check(addr, fam === 4 ? 'ipv4' : 'ipv6') : false;
}

export interface ListenDeps {
  createServer?: (h: http.RequestListener) => http.Server;
  retryMs?: number;
  log?: (msg: string) => void;
  schedule?: (fn: () => void, ms: number) => unknown;
}

/** 每个地址一个 http.Server；绑定失败记录日志，每 retryMs 重试，不退出进程 */
export function startListeners(hosts: string[], port: number, handler: http.RequestListener, deps: ListenDeps = {}) {
  const create = deps.createServer ?? ((h) => http.createServer(h));
  const retryMs = deps.retryMs ?? 30_000;
  const log = deps.log ?? ((m) => console.log(m));
  const schedule = deps.schedule ?? ((fn, ms) => setTimeout(fn, ms).unref());
  const status = new Map<string, 'listening' | 'retrying'>();
  const servers: http.Server[] = [];
  const attempt = (host: string) => {
    const srv = create(handler);
    const onError = (err: NodeJS.ErrnoException) => {
      srv.removeListener('listening', onListening);
      status.set(host, 'retrying');
      log(`[listen] ${host}:${port} 绑定失败 ${err.code ?? err.message}，${retryMs / 1000}s 后重试`);
      schedule(() => attempt(host), retryMs);
    };
    const onListening = () => {
      srv.removeListener('error', onError);
      status.set(host, 'listening'); servers.push(srv);
      log(`[listen] vocab app listening on http://${host.includes(':') ? `[${host}]` : host}:${port}`);
    };
    srv.once('error', onError);
    srv.once('listening', onListening);
    srv.listen(port, host);
  };
  hosts.forEach(attempt);
  return { status, servers, close: () => Promise.all(servers.map((s) => new Promise((r) => s.close(() => r(null))))) };
}
