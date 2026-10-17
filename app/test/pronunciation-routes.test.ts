import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDb } from '../server/src/db.ts';
import { buildApp } from '../server/src/app.ts';
import { temp } from './p2-helpers.ts';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function fixture() {
  const directory = temp('pronunciation-');
  const db = openDb(':memory:');
  for (const word of ['receive', 'accept', 'Miss', 'miss', 'go (went, gone)'])
    db.prepare("INSERT INTO words(headword,source) VALUES (?,'test')").run(word);
  const entry = (word = 'receive') => ({ word, accent: 'us', file: `${word}.mp3`, author: 'Test Speaker',
    sha256: createHash('sha256').update('ID3fixture').digest('hex'),
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:En-us-receive.ogg', license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0' });
  fs.writeFileSync(path.join(directory, 'receive.mp3'), Buffer.from('ID3fixture'));
  const entries: Record<string, any> = { receive: entry() };
  const save = () => fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ version: 1, entries }));
  save();
  const app = buildApp(db, { pronunciationDir: directory });
  cleanups.push(async () => { await app.close(); db.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { app, directory, entries, entry, save };
}
describe('human pronunciation routes', () => {
  it('serves local MP3 and attribution, and reports absent recordings honestly', async () => {
    const { app } = await fixture();
    const audio = await app.inject('/api/pronunciation/audio?word=receive');
    expect(audio.statusCode).toBe(200);
    expect(audio.headers['content-type']).toBe('audio/mpeg');
    expect(audio.rawPayload).toEqual(Buffer.from('ID3fixture'));
    const meta = (await app.inject('/api/pronunciation?word=receive')).json();
    expect(meta).toMatchObject({ status: 'ready', author: 'Test Speaker', license: 'CC BY-SA 3.0' });
    expect(meta.file).toBeUndefined();
    expect((await app.inject('/api/pronunciation?word=accept')).json()).toEqual({ status: 'missing', word: 'accept' });
    expect((await app.inject('/api/pronunciation/audio?word=accept')).statusCode).toBe(404);
    const credits = await app.inject('/api/pronunciation/credits?word=receive');
    expect(credits.body).toContain('Test Speaker');
    expect(credits.body).toContain('https://creativecommons.org/licenses/by-sa/3.0');
  });
  it('preserves case, resolves parenthetical headwords, and rejects invalid queries', async () => {
    const { app, directory, entries, entry, save } = await fixture();
    for (const word of ['Miss', 'go']) { entries[word] = entry(word); fs.writeFileSync(path.join(directory, `${word}.mp3`), 'ID3fixture'); }
    save();
    expect((await app.inject('/api/pronunciation/audio?word=Miss')).statusCode).toBe(200);
    expect((await app.inject('/api/pronunciation/audio?word=miss')).statusCode).toBe(404);
    expect((await app.inject('/api/pronunciation/audio?word=go%20(went%2C%20gone)')).statusCode).toBe(200);
    for (const query of ['', '?word=../receive', '?word=receive&word=accept', '?word[]=receive'])
      expect((await app.inject('/api/pronunciation/audio' + query)).statusCode).toBe(400);
  });
  it('rejects traversal/symlink files, missing files and unsafe attribution URLs', async () => {
    const { app, directory, entries, entry, save } = await fixture();
    entries.receive.file = '../receive.mp3'; save();
    expect((await app.inject('/api/pronunciation/audio?word=receive')).statusCode).toBe(404);
    const outside = path.join(directory, '..', path.basename(directory) + '.mp3');
    fs.writeFileSync(outside, 'ID3outside');
    try {
      fs.symlinkSync(outside, path.join(directory, 'escape.mp3'));
      entries.receive.file = 'escape.mp3'; save();
      expect((await app.inject('/api/pronunciation/audio?word=receive')).statusCode).toBe(404);
    } finally { fs.rmSync(outside); }
    entries.receive = { ...entry(), sourceUrl: 'javascript:alert(1)' }; save();
    expect((await app.inject('/api/pronunciation?word=receive')).json().status).toBe('missing');
    entries.receive = { ...entry(), file: 'absent.mp3' }; save();
    expect((await app.inject('/api/pronunciation?word=receive')).json().status).toBe('missing');
  });
  it('escapes author text and fails closed for an interrupted manifest write', async () => {
    const { app, entries, save, directory } = await fixture();
    entries.receive.author = '<script>alert("hi")</script>'; save();
    const credits = await app.inject('/api/pronunciation/credits');
    expect(credits.body).not.toContain('<script>');
    expect(credits.body).toContain('&lt;script&gt;');
    fs.writeFileSync(path.join(directory, 'manifest.json'), '{');
    expect((await app.inject('/api/pronunciation/audio?word=receive')).statusCode).toBe(404);
  });
  it('invalidates readiness when cached audio becomes empty or its bytes no longer match', async () => {
    const { app, directory, entries, save } = await fixture();
    expect((await app.inject('/api/pronunciation?word=receive')).json().status).toBe('ready');
    fs.writeFileSync(path.join(directory, 'receive.mp3'), '');
    expect((await app.inject('/api/pronunciation?word=receive')).json().status).toBe('missing');
    expect((await app.inject('/api/pronunciation/audio?word=receive')).statusCode).toBe(404);
    fs.writeFileSync(path.join(directory, 'receive.mp3'), 'ID3changed');
    expect((await app.inject('/api/pronunciation?word=receive')).json().status).toBe('missing');
    fs.writeFileSync(path.join(directory, 'receive.mp3'), 'ID3fixture');
    expect((await app.inject('/api/pronunciation?word=receive')).json().status).toBe('ready');
    entries.receive.sha256 = '0'.repeat(64); save();
    expect((await app.inject('/api/pronunciation?word=receive')).json().status).toBe('missing');
    expect((await app.inject('/api/pronunciation/credits?word=receive')).body).not.toContain('Test Speaker');
  });
});
