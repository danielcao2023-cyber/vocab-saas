import {it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {exportFile} from '../server/src/ai/transfer.ts';
import {dbArg} from '../server/src/ai/cli.ts';
import {openDb} from '../server/src/db.ts';
import {temp} from './p2-helpers.ts';
const tsx=path.resolve('node_modules/.bin/tsx');
it('dbArg and export refuse $HOME/apps paths, including through symlinks',()=>{const home=temp('home-');try{fs.mkdirSync(path.join(home,'apps/vocab/data'),{recursive:true});const prod=path.join(home,'apps/vocab/data/app.db');openDb(prod).close();fs.symlinkSync(path.join(home,'apps/vocab'),path.join(home,'link'));
  expect(()=>dbArg({db:prod},'db',home)).toThrow('正式库');expect(()=>dbArg({db:path.join(home,'link/data/app.db')},'db',home)).toThrow('正式库');expect(dbArg({db:path.join(home,'qa.db')},'db',home)).toBe(path.join(home,'qa.db'));
  expect(()=>exportFile(prod,path.join(home,'out.json'),home)).toThrow('正式库');expect(()=>exportFile(path.join(home,'qa.db'),path.join(home,'apps/out.json'),home)).toThrow('正式库');expect(fs.existsSync(path.join(home,'out.json'))).toBe(false);
}finally{fs.rmSync(home,{recursive:true,force:true});}});
it.each([['ai-generate',['--ecdict','x.csv','--dry-run']],['ai-review',['stats']],['import-forms',['--ecdict','x.csv']],['freq-daily',['--ecdict','x.csv']],['freq-zk-rank',[]],['ai-content-export',['--out','o.json']],['ai-content-import',['--in','i.json']],['seed-due',['--list','list.csv','--ecdict','x.csv']],['verify-migration',[]]])('%s refuses a DB under $HOME/apps before opening it',(script,extra)=>{
  const home=temp('home-');try{const dir=path.join(home,'apps/vocab/data');fs.mkdirSync(dir,{recursive:true});const prod=path.join(dir,'app.db');openDb(prod).close();const before=fs.readFileSync(prod);
    fs.writeFileSync(path.join(home,'x.csv'),'word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio\n');fs.writeFileSync(path.join(home,'i.json'),'{}');fs.writeFileSync(path.join(home,'list.csv'),'headword\ngo\n');const files=fs.readdirSync(dir).sort();
    const r=spawnSync(tsx,[path.resolve(`scripts/${script}.ts`),...extra,'--db',prod],{cwd:home,env:{...process.env,HOME:home},encoding:'utf8'});
    expect(r.status,r.stderr).not.toBe(0);expect(r.status).not.toBeNull();expect(r.stderr).toContain("正式库");expect(fs.readFileSync(prod).equals(before)).toBe(true);expect(fs.readdirSync(dir).sort()).toEqual(files);if(script==='verify-migration'){expect(r.stderr).toContain('只读核对');expect(r.stderr).not.toContain('--backup');}
  }finally{fs.rmSync(home,{recursive:true,force:true});}
},30000);
