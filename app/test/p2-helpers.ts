import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { DB } from '../server/src/db.ts';
export function temp(prefix='p2-') {const root=path.resolve('../.tmp');fs.mkdirSync(root,{recursive:true});return fs.mkdtempSync(path.join(root,prefix));}
export function snapshot(db:DB,exclude:string[]=[]) {
  const tables=(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name:string}[]).map(t=>t.name).filter(t=>!exclude.includes(t));
  return Object.fromEntries(tables.map(t=>[t,createHash('sha256').update(JSON.stringify(db.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all())).digest('hex')]));
}
export function item(word='go',changes:Record<string,any>={}) {return {word,examples:[],collocations:[],distinctions:[],synonyms:[],antonyms:[],pronunciation:null,etymology:null,association:null,related_words:[],...changes};}
export function writeFixture(dir:string) {const file=path.join(dir,'ecdict.csv');fs.writeFileSync(file,'word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio\ngo,,,去,,,,,25,10,p:went/d:gone/i:going/3:goes,,\nchild,,,孩子,,,,,5,0,s:children,,\nempty,,,空,,,,,0,0,,,\nstudy,,,学习,,,,,8,30,p:studied/i:studying/3:studies,,\nstop,,,停,,,,,0,20,p:stopped/i:stopping,,\n');return file;}
