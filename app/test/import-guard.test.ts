// D7：正式词表导入 server/src/import.ts 的正式库保护。$HOME 注入为临时目录（../.tmp 下），测完删除，不碰真实 $HOME/apps。
import {it,expect,beforeEach,afterEach} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import Database from 'better-sqlite3';
import {openDb} from '../server/src/db.ts';
import {productionGate,checkBackupPath,readSnapshot,isProduction} from '../server/src/guard.ts';
import {temp,writeFixture} from './p2-helpers.ts';
const tsx=path.resolve('node_modules/.bin/tsx'),entry=path.resolve('server/src/import.ts');
let H:string,dir:string,prod:string,list:string,ecdict:string;
const sha=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const mem=(f:string)=>{const b=fs.readFileSync(f);b[18]=1;b[19]=1;return new Database(b);};
const listing=(d:string)=>fs.readdirSync(d).sort();
function run(...extra:string[]){const env={...process.env,HOME:H};delete (env as any).DB_PATH;return spawnSync(tsx,[entry,'--list',list,'--source','sample','--ecdict',ecdict,...extra],{cwd:H,env,encoding:'utf8'});}
beforeEach(()=>{H=temp('home-');dir=path.join(H,'apps/vocab/data');fs.mkdirSync(dir,{recursive:true});prod=path.join(dir,'app.db');
  const db=openDb(prod);db.prepare("INSERT INTO words(headword,meaning_zh,source,level) VALUES ('go','改过的释义','sample','二级')").run();db.close();
  list=path.join(H,'list.csv');fs.writeFileSync(list,'headword,level\ngo,二级\nstudy,二级\n');ecdict=writeFixture(H);fs.mkdirSync(path.join(H,'backups'));fs.symlinkSync(path.join(H,'apps/vocab'),path.join(H,'link'));});
afterEach(()=>fs.rmSync(H,{recursive:true,force:true}));
it.each([[[]],[['--dry-run']],[['--backup','BACKUP']],[['--link']]])('refused by default with a clear message, nothing written: %j',(args:string[])=>{
  const before=sha(prod),files=listing(dir);const db=args[0]==='--link'?path.join(H,'link/data/app.db'):prod;
  const r=run('--db',db,...args.filter(a=>a!=='--link').map(a=>a==='BACKUP'?path.join(H,'backups/b.db'):a));
  expect(r.status,r.stdout).toBe(1);expect(r.stderr).toContain('是正式库');expect(r.stderr).toContain('--allow-production');
  expect(sha(prod)).toBe(before);expect(listing(dir)).toEqual(files);expect(listing(path.join(H,'backups'))).toEqual([]);
});
it('--allow-production without --backup, or with an unsafe backup path, is refused before any write',()=>{
  const before=sha(prod),files=listing(dir);
  for(const [extra,msg] of [[[],'--backup <路径>'],[['--backup',path.join(dir,'other.bak')],'带时间戳'],[['--backup',prod],'库本身'],[['--backup',path.join(dir,'app.db-old')],'带时间戳']] as const){
    const r=run('--db',prod,'--allow-production',...extra);expect(r.status).toBe(1);expect(r.stderr).toContain(msg);}
  fs.writeFileSync(path.join(H,'backups/exists.db'),'x');const r=run('--db',prod,'--allow-production','--backup',path.join(H,'backups/exists.db'));expect(r.stderr).toContain('已存在');
  expect(sha(prod)).toBe(before);expect(listing(dir)).toEqual(files);
});
it('--allow-production --dry-run writes nothing anywhere (no -wal/-shm, no backup) and --dry-run refuses --backup',()=>{
  const before=sha(prod),files=listing(dir),home=listing(H);
  const r=run('--db',prod,'--allow-production','--dry-run');expect(r.status,r.stderr).toBe(0);expect(JSON.parse(r.stdout).source).toBe('sample');
  expect(sha(prod)).toBe(before);expect(listing(dir)).toEqual(files);expect(listing(H)).toEqual(home);
  const b=run('--db',prod,'--allow-production','--dry-run','--backup',path.join(H,'backups/x.db'));expect(b.status).toBe(1);expect(b.stderr).toContain('不能和 --backup');expect(listing(path.join(H,'backups'))).toEqual([]);
});
it.each(['outside','stamped'])('--allow-production with a %s backup writes a verified backup before importing',kind=>{
  const before=sha(prod);const backup=kind==='outside'?path.join(H,'backups/app.db.bak'):path.join(dir,'app.db.20261017-190000.bak');
  const r=run('--db',prod,'--allow-production','--backup',backup);expect(r.status,r.stderr).toBe(0);
  const info=JSON.parse(r.stderr.trim().split('\n').find(l=>l.startsWith('{"backup"'))!).backup;
  expect(sha(backup)).toBe(info.sha256);expect(fs.readFileSync(backup+'.sha256','utf8')).toBe(`${info.sha256}  ${path.basename(backup)}\n`);
  const copy=mem(backup);expect(copy.prepare("SELECT meaning_zh FROM words WHERE headword='go'").get()).toEqual({meaning_zh:'改过的释义'});copy.close();
  expect(sha(prod)).not.toBe(before);const db=mem(prod);expect((db.prepare("SELECT meaning_zh FROM words WHERE headword='go'").get() as any).meaning_zh).not.toBe('改过的释义');db.close();
});
it('a non-production dry-run never creates files next to the db either',()=>{
  const qa=path.join(H,'qa.db');openDb(qa).close();const before=sha(qa),home=listing(H);
  const r=run('--db',qa,'--dry-run');expect(r.status,r.stderr).toBe(0);expect(sha(qa)).toBe(before);expect(listing(H)).toEqual(home);
});
it('guard units: injectable home, realpath through links, stamped siblings, snapshot without side files',()=>{
  expect(isProduction(path.join(H,'link/data/app.db'),H)).toBe(true);expect(isProduction(path.join(H,'qa.db'),H)).toBe(false);expect(isProduction(':memory:',H)).toBe(false);
  expect(()=>productionGate(prod,{home:H})).toThrow('--allow-production');expect(productionGate(prod,{home:H,allowProduction:true,dryRun:true})).toEqual({production:true,backup:undefined});
  expect(checkBackupPath(prod,path.join(dir,'app.db.20261017-190000'))).toBe(path.join(fs.realpathSync(dir),'app.db.20261017-190000'));
  const files=listing(dir);expect(readSnapshot(prod).length).toBeGreaterThan(0);expect(listing(dir)).toEqual(files);
});
