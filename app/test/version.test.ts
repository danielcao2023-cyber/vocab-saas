import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { readVersion } from '../server/src/version.ts';
import { buildApp } from '../server/src/app.ts';
import { openDb } from '../server/src/db.ts';

afterEach(() => { delete process.env.APP_COMMIT; });
describe('version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ver-'));
  it('env > file > unknown, never throws', () => {
    expect(readVersion(path.join(dir, 'nope')).commit).toBe('unknown');
    fs.writeFileSync(path.join(dir, 'version.json'), '{bad json');
    expect(readVersion(dir).commit).toBe('unknown');
    fs.writeFileSync(path.join(dir, 'version.json'), '{"commit":"abc1234","dirty":false}');
    expect(readVersion(dir)).toMatchObject({ commit: 'abc1234', source: 'version.json' });
    process.env.APP_COMMIT = 'envhash';
    expect(readVersion(dir)).toMatchObject({ commit: 'envhash', source: 'env' });
  });
  it('/health and /version expose commit', async () => {
    fs.writeFileSync(path.join(dir, 'version.json'), '{"commit":"abc1234"}');
    const app = buildApp(openDb(':memory:'), { staticDir: dir });
    expect((await app.inject('/health')).json().commit).toBe('abc1234');
    expect((await app.inject('/version')).json().commit).toBe('abc1234');
  });
});
