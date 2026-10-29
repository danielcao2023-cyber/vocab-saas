import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import type { DB } from './db.ts';
import { mainHeadwords } from './text.ts';

const DEFAULT_DIRECTORY = fileURLToPath(new URL('../../data/pronunciation/', import.meta.url));
interface Recording {
  word: string; accent: 'us' | 'uk' | 'unknown'; file: string; sha256: string;
  sourceUrl: string; author: string; license: string; licenseUrl: string;
  pronunciationNote?: string;
  ipa?: string;
  variants?: Partial<Record<'noun' | 'verb', Recording>>;
}
const safeUrl = (value: unknown): value is string => {
  try { const u = new URL(String(value)); return u.protocol === 'https:' && !u.username && !u.password; }
  catch { return false; }
};
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Serve verified, imported recordings locally: browser playback never depends on a third-party API. */
export function pronunciationRoutes(app: FastifyInstance, db: DB, directory = DEFAULT_DIRECTORY) {
  const knownWords = new Set((db.prepare('SELECT headword FROM words').all() as { headword: string }[])
    .flatMap(row => mainHeadwords(row.headword)).filter(Boolean));
  const integrity = new Map<string, { identity: string; digest: string }>();
  function fileIsIntact(file: string, expected: string): boolean {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size === 0 || stat.size > 2_000_000) return false;
    const identity = [stat.dev, stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs].join(':');
    let cached = integrity.get(file);
    if (!cached || cached.identity !== identity) {
      cached = { identity, digest: createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
      if (integrity.size > 4096) integrity.clear();
      integrity.set(file, cached);
    }
    return cached.digest === expected;
  }
  function recordings(): Map<string, Recording> {
    const result = new Map<string, Recording>();
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
      if (manifest.version !== 1 || !manifest.entries || typeof manifest.entries !== 'object') return result;
      const root = fs.realpathSync(directory) + path.sep;
      for (const [word, value] of Object.entries(manifest.entries)) {
        const base = value as Recording;
        const candidates: [string, Recording | undefined][] = [[word, base],
          ...(['noun', 'verb'] as const).map(variant => [`${word}\0${variant}`, base?.variants?.[variant]] as [string, Recording | undefined])];
        for (const [key, r] of candidates) {
          if (!r || r.word !== word || !knownWords.has(word) || !['us', 'uk', 'unknown'].includes(r.accent) ||
            typeof r.file !== 'string' || !/^[A-Za-z0-9_-]+\.mp3$/.test(r.file) ||
            typeof r.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(r.sha256) ||
            ![r.author, r.license].every(v => typeof v === 'string' && v.trim()) ||
            !safeUrl(r.sourceUrl) || !safeUrl(r.licenseUrl)) continue;
          try {
            const file = fs.realpathSync(path.join(directory, r.file));
            if (!file.startsWith(root) || !fileIsIntact(file, r.sha256)) continue;
            result.set(key, r);
          } catch { /* An interrupted import must not advertise a missing file as ready. */ }
        }
      }
    } catch { /* A fresh installation has no ready recordings. */ }
    return result;
  }
  function wordFor(value: string | undefined): string | undefined {
    if (!value || value.length > 100) return;
    const word = mainHeadwords(value)[0];
    return word && knownWords.has(word) ? word : undefined;
  }
  function variantFor(query: Record<string, unknown>): 'noun' | 'verb' | undefined | null {
    if (Object.keys(query).some(key => key.startsWith('variant['))) return null;
    if (query.variant === undefined) return undefined;
    return query.variant === 'noun' || query.variant === 'verb' ? query.variant : null;
  }
  app.get<{ Querystring: { word?: string; variant?: string } }>('/api/pronunciation', async (req, reply) => {
    const word = wordFor(req.query.word);
    reply.header('Cache-Control', 'no-store');
    if (!word) return reply.code(400).send({ error: 'invalid word' });
    const variant = variantFor(req.query);
    if (variant === null) return reply.code(400).send({ error: 'invalid variant' });
    const available = recordings();
    const variants = variant ? [] : (['noun', 'verb'] as const).flatMap(name => {
      const recording = available.get(`${word}\0${name}`);
      return recording ? [{ variant: name, label: name === 'noun' ? '名词' : '动词',
        ...(typeof recording.ipa === 'string' && recording.ipa.trim() ? { ipa: recording.ipa } : {}) }] : [];
    });
    const r = available.get(variant ? `${word}\0${variant}` : word);
    if (!r) return { status: 'missing', word, ...(variants.length ? { variants } : {}) };
    return { status: 'ready', word: r.word, accent: r.accent, sourceUrl: r.sourceUrl,
      ...(variants.length ? { variants } : {}),
      author: r.author, license: r.license, licenseUrl: r.licenseUrl,
      ...(typeof r.pronunciationNote === 'string' ? { pronunciationNote: r.pronunciationNote } : {}) };
  });
  app.get<{ Querystring: { word?: string; variant?: string } }>('/api/pronunciation/audio', async (req, reply) => {
    const word = wordFor(req.query.word);
    if (!word) return reply.code(400).send({ error: 'invalid word' });
    const variant = variantFor(req.query);
    if (variant === null) return reply.code(400).send({ error: 'invalid variant' });
    const r = recordings().get(variant ? `${word}\0${variant}` : word);
    if (!r) return reply.code(404).header('Cache-Control', 'no-store').send({ error: 'recording unavailable' });
    try {
      const bytes = fs.readFileSync(path.join(directory, r.file));
      // Verify the bytes we actually serve too, in case the file changed after manifest validation.
      if (createHash('sha256').update(bytes).digest('hex') !== r.sha256)
        return reply.code(404).header('Cache-Control', 'no-store').send({ error: 'recording unavailable' });
      return reply.type('audio/mpeg').header('Cache-Control', 'private, max-age=0, must-revalidate')
        .header('X-Content-Type-Options', 'nosniff').send(bytes);
    } catch { return reply.code(404).send({ error: 'recording unavailable' }); }
  });
  app.get<{ Querystring: { word?: string } }>('/api/pronunciation/credits', async (req, reply) => {
    const word = req.query.word === undefined ? undefined : wordFor(req.query.word);
    if (req.query.word !== undefined && !word) return reply.code(400).send({ error: 'invalid word' });
    const entries = [...recordings().entries()].filter(([, r]) => word === undefined || r.word === word)
      .sort((a, b) => a[0].localeCompare(b[0]));
    const rows = entries.map(([key, r]) => `<tr><td>${escapeHtml(r.word)}${key.includes('\0') ? ` (${escapeHtml(key.split('\0')[1])})` : ''}</td><td>${r.accent === 'us' ? '美式' : r.accent === 'uk' ? '英式' : '英语'}${typeof r.pronunciationNote === 'string' && r.pronunciationNote ? `<br>${escapeHtml(r.pronunciationNote)}` : ''}</td><td>${escapeHtml(r.author)}</td><td><a href="${escapeHtml(r.sourceUrl)}">原始录音</a></td><td><a href="${escapeHtml(r.licenseUrl)}">${escapeHtml(r.license)}</a></td></tr>`).join('');
    return reply.type('text/html; charset=utf-8').header('Cache-Control', 'no-store')
      .header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'")
      .send(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>录音来源</title><style>body{font:16px/1.7 system-ui;margin:32px auto;padding:0 20px;max-width:960px;color:#172536}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:10px;border-bottom:1px solid #ddd}a{color:#1261a0}</style><h1>录音来源</h1><p>这些英语发音来自真人录音。音频转换为 MP3，保留原许可；作者、原始文件与许可见下表。</p>${entries.length ? `<table><thead><tr><th>单词</th><th>口音</th><th>作者</th><th>来源</th><th>许可</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>这条录音暂未准备好，请稍后重试。</p>'}</html>`);
  });
}
