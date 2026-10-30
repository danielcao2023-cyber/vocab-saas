import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {buildApp} from '../server/src/app';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';

it('adds the US verb recording without changing the default noun playback',async()=>{
 const source=JSON.parse(readFileSync('data/pronunciation/manifest.json','utf8')).entries.desert;
 const verb=source.variants.verb,noun=source.variants.noun;
 expect(source.file).toBe('desert-237ab3365842.mp3');expect(noun.sha256).toBe(source.sha256);
 expect(verb).toMatchObject({word:'desert',author:'Dvortygirl',license:'Public domain (PD-self)',sourceUrl:'https://commons.wikimedia.org/wiki/File:En-us-desert-verb.ogg',sha256:'074cde90fdd969c5f38a1a7c4a619acf43ee7e68bc5eae7efe929372a51fcfe6'});
 const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 expect(hash(readFileSync(join('data/pronunciation',verb.file)))).toBe(verb.sha256);
 const db=openDb(':memory:');db.prepare("INSERT INTO words(headword,source) VALUES ('desert','test')").run();
 const app=buildApp(db,{pronunciationDir:join(process.cwd(),'data/pronunciation')});
 const dir=mkdtempSync(join(tmpdir(),'desert-pack-'));mkdirSync(join(dir,'recordings'));
 try{
  const base=await app.inject('/api/pronunciation/audio?word=desert');expect(base.statusCode).toBe(200);expect(hash(base.rawPayload)).toBe(source.sha256);
  const response=await app.inject('/api/pronunciation/audio?word=desert&variant=verb');expect(response.statusCode).toBe(200);expect(hash(response.rawPayload)).toBe(verb.sha256);
  const info=await app.inject('/api/pronunciation?word=desert');expect(info.json().variants.map((x:{variant:string})=>x.variant)).toEqual(['noun','verb']);
  const packed=packPronunciations({version:1,entries:{desert:source}},'data/pronunciation',join(dir,'recordings'));
  expect(hash(readFileSync(join(dir,'recordings',verb.file)))).toBe(verb.sha256);expect(packed.credits).toContain('Dvortygirl');expect(packed.credits).toContain('尚未人工试听');
 }finally{await app.close();db.close();rmSync(dir,{recursive:true,force:true});}
});
