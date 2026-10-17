import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { ConfigError, isAllowed, parseCidrs, parseHosts, parsePort, startListeners } from '../server/src/net.ts';
import { openDb } from '../server/src/db.ts';
import { buildApp } from '../server/src/app.ts';

describe('config', () => {
  it('parses hosts/port, rejects invalid', () => {
    expect(parseHosts(undefined)).toEqual(['127.0.0.1']);
    expect(parseHosts('127.0.0.1, 100.64.0.5,::1')).toEqual(['127.0.0.1', '100.64.0.5', '::1']);
    expect(() => parseHosts('foo.bar')).toThrow(ConfigError);
    expect(() => parseHosts(' , ')).toThrow(ConfigError);
    expect(() => parsePort('99999')).toThrow(ConfigError);
    expect(() => parseCidrs('10.0.0.0/33')).toThrow(ConfigError);
    expect(() => parseCidrs('nope/8')).toThrow(ConfigError);
  });
});

describe('allowlist', () => {
  it('default allows only loopback', () => {
    const l = parseCidrs(undefined);
    expect(isAllowed(l, '127.0.0.1')).toBe(true);
    expect(isAllowed(l, '::1')).toBe(true);
    expect(isAllowed(l, '::ffff:127.0.0.1')).toBe(true);
    expect(isAllowed(l, '192.168.1.5')).toBe(false);
    expect(isAllowed(l, undefined)).toBe(false);
  });
  it('custom CIDRs', () => {
    const l = parseCidrs('192.168.1.0/24,100.64.0.0/10,fd7a:115c:a1e0::/48');
    expect(isAllowed(l, '192.168.1.200')).toBe(true);
    expect(isAllowed(l, '192.168.2.1')).toBe(false);
    expect(isAllowed(l, '100.101.33.1')).toBe(true);
    expect(isAllowed(l, 'fd7a:115c:a1e0::5')).toBe(true);
    expect(isAllowed(l, '127.0.0.1')).toBe(false);
  });
  it('returns 403 on /health for disallowed source', async () => {
    const db = openDb(':memory:');
    const deny = buildApp(db, { allow: parseCidrs('10.0.0.0/8') });
    expect((await deny.inject({ url: '/health', remoteAddress: '127.0.0.1' })).statusCode).toBe(403);
    expect((await deny.inject({ url: '/api/today', remoteAddress: '10.1.2.3' })).statusCode).toBe(200);
    const ok = buildApp(db, { allow: parseCidrs(undefined) });
    expect((await ok.inject({ url: '/health', remoteAddress: '127.0.0.1' })).statusCode).toBe(200);
  });
});

describe('listeners retry', () => {
  it('retries failed bind every 30s, keeps others up, never exits', () => {
    const failsLeft: Record<string, number> = { '100.64.0.5': 2 };
    const scheduled: { fn: () => void; ms: number }[] = [];
    const logs: string[] = [];
    let current = '';
    const fake = () => {
      const s = new EventEmitter() as any;
      s.listen = (_p: number, host: string) => {
        current = host;
        queueMicrotask(() => {});
        if ((failsLeft[host] ?? 0) > 0) { failsLeft[host]--; s.emit('error', Object.assign(new Error('x'), { code: 'EADDRNOTAVAIL' })); }
        else s.emit('listening');
      };
      s.close = (cb: () => void) => cb();
      return s;
    };
    const r = startListeners(['127.0.0.1', '100.64.0.5'], 18420, () => {}, {
      createServer: fake, log: (m) => logs.push(m), schedule: (fn, ms) => scheduled.push({ fn, ms }),
    });
    expect(current).toBe('100.64.0.5');
    expect(r.status.get('127.0.0.1')).toBe('listening');
    expect(r.status.get('100.64.0.5')).toBe('retrying');
    expect(scheduled).toHaveLength(1); expect(scheduled[0].ms).toBe(30_000);
    scheduled.shift()!.fn(); // 第二次仍失败
    expect(scheduled).toHaveLength(1);
    scheduled.shift()!.fn(); // 第三次成功
    expect(scheduled).toHaveLength(0);
    expect(r.status.get('100.64.0.5')).toBe('listening');
    expect(r.servers).toHaveLength(2);
    expect(logs.filter((l) => l.includes('EADDRNOTAVAIL'))).toHaveLength(2);
  });
});
