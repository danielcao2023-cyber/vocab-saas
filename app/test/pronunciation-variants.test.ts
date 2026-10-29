import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { openDb } from '../server/src/db.ts';
import { buildApp } from '../server/src/app.ts';
import { temp } from './p2-helpers.ts';

it('keeps default playback and serves independently verified noun and verb variants without fallback', async () => {
  const directory = temp('pronunciation-variants-');
  const db = openDb(':memory:');
  db.prepare("INSERT INTO words(headword,source) VALUES ('estimate','test')").run();
  const make = (name: string) => {
    const data = `ID3-${name}`;
    fs.writeFileSync(path.join(directory, `${name}.mp3`), data);
    return { word: 'estimate', accent: 'us', file: `${name}.mp3`, sha256: createHash('sha256').update(data).digest('hex'), author: name, sourceUrl: `https://example.org/${name}`, license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' };
  };
  const entry = {...make('default'), ipa:'/boʊ/', variants: {noun: {...make('noun'), label:'弓、蝴蝶结'}, verb: make('verb')}};
  Object.assign(entry.variants.noun, {ipa: '/ˈestɪmət/', pronunciationNote: '加拿大口音'});
  const save = () => fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({version: 1, entries: { estimate: entry }}));
  save();
  const app = buildApp(db, {pronunciationDir: directory});
  try {
    for (const [suffix, data] of [['', 'default'], ['&variant=noun', 'noun'], ['&variant=verb', 'verb']]) {
      const audio = await app.inject(`/api/pronunciation/audio?word=estimate${suffix}`);
      expect(audio.statusCode).toBe(200);
      expect(audio.body).toBe(`ID3-${data}`);
      const meta = (await app.inject(`/api/pronunciation?word=estimate${suffix}`)).json();
      expect(meta).toMatchObject({status:'ready', author:data});
    }
    expect((await app.inject('/api/pronunciation?word=estimate')).json().ipa).toBe('/boʊ/');
    expect((await app.inject('/api/pronunciation?word=estimate')).json().variants).toEqual([
      {variant:'noun',label:'弓、蝴蝶结',ipa:'/ˈestɪmət/',pronunciationNote:'加拿大口音'}, {variant:'verb',label:'动词'}
    ]);
    const credits = (await app.inject('/api/pronunciation/credits?word=estimate')).body;
    expect(credits).toContain('noun');
    expect(credits).toContain('verb');
    for (const suffix of ['&variant=adj', '&variant=', '&variant=noun&variant=verb', '&variant[]=noun']) {
      expect((await app.inject(`/api/pronunciation?word=estimate${suffix}`)).statusCode).toBe(400);
      expect((await app.inject(`/api/pronunciation/audio?word=estimate${suffix}`)).statusCode).toBe(400);
    }
    entry.variants.noun.sha256 = '0'.repeat(64); save();
    expect((await app.inject('/api/pronunciation?word=estimate&variant=noun')).json()).toMatchObject({status:'missing'});
    expect((await app.inject('/api/pronunciation/audio?word=estimate&variant=noun')).statusCode).toBe(404);
    expect((await app.inject('/api/pronunciation?word=estimate')).json().ipa).toBe('/boʊ/');
    expect((await app.inject('/api/pronunciation?word=estimate')).json().variants).toEqual([{variant:'verb',label:'动词'}]);
    expect((await app.inject('/api/pronunciation/audio?word=estimate&variant=verb')).body).toBe('ID3-verb');
    entry.variants.verb.licenseUrl = 'javascript:alert(1)'; save();
    expect((await app.inject('/api/pronunciation/audio?word=estimate&variant=verb')).statusCode).toBe(404);
    expect((await app.inject('/api/pronunciation/audio?word=estimate')).body).toBe('ID3-default');
    entry.variants.verb.licenseUrl = 'https://creativecommons.org/licenses/by/4.0/';
    entry.sha256 = '0'.repeat(64); save();
    const missing = (await app.inject('/api/pronunciation?word=estimate')).json();
    expect(missing.status).toBe('missing');
    expect(missing.variants).toEqual([{variant:'verb', label:'动词'}]);
    expect((await app.inject('/api/pronunciation/audio?word=estimate&variant=verb')).body).toBe('ID3-verb');
  } finally { await app.close(); db.close(); fs.rmSync(directory, {recursive:true,force:true}); }
});
