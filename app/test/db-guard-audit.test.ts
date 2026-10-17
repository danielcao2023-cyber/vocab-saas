// N2 / D8：所有接受库路径的 CLI（scripts/ 下全部脚本，以及 server/src 里带 shebang 或解析 process.argv 并打开库的入口），
// 在打开库（openDb / new Database / Database()）之前必须真的调用正式库保护。用 TypeScript AST 判断：注释、字符串里的
// “protectTarget(” 不算；保护调用必须在打开之前，或直接作为打开调用的参数（new Database(dbArg(a))）。
// 保护函数：protectTarget；以及经下面单独核对过、内部调用 protectTarget/isProduction 的 dbArg、productionGate。
import {it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {temp} from './p2-helpers.ts';
const EXT=/\.(ts|mts|cts|js|mjs|cjs)$/;
const GUARDS=new Set(['protectTarget','dbArg','productionGate']);
const EXEMPT=new Set(['server/src/main.ts']); // 服务本身：正式环境就靠它跑
const kind=(f:string)=>/\.(js|mjs|cjs)$/.test(f)?ts.ScriptKind.JS:ts.ScriptKind.TS;
const parse=(file:string,text:string)=>ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,kind(file));
const calleeName=(e:ts.Expression):string|undefined=>ts.isIdentifier(e)?e.text:ts.isPropertyAccessExpression(e)?e.name.text:undefined;
function walk(n:ts.Node,f:(n:ts.Node)=>void){f(n);n.forEachChild(c=>walk(c,f));}
export function analyze(file:string,text:string){
  const sf=parse(file,text);const sqlite=new Set(['Database']),openers=new Set(['openDb']);
  let argv=false,shebang=text.startsWith('#!'),dbFlag=false,positional=false;
  walk(sf,n=>{
    if(ts.isImportDeclaration(n)&&ts.isStringLiteral(n.moduleSpecifier)&&n.importClause){const m=n.moduleSpecifier.text,c=n.importClause;
      if(m==='better-sqlite3'){if(c.name)sqlite.add(c.name.text);const b=c.namedBindings;if(b&&ts.isNamespaceImport(b))sqlite.add(b.name.text);}
      if(/(^|\/)db(\.[mc]?[jt]s)?$/.test(m)&&c.namedBindings&&ts.isNamedImports(c.namedBindings))for(const e of c.namedBindings.elements)if((e.propertyName??e.name).text==='openDb')openers.add(e.name.text);}
    if(ts.isVariableDeclaration(n)&&n.initializer){let init:ts.Expression=n.initializer;if(ts.isAwaitExpression(init))init=init.expression;
      const mod=ts.isCallExpression(init)&&init.arguments[0]&&ts.isStringLiteral(init.arguments[0])&&(calleeName(init.expression)==='require'||init.expression.kind===ts.SyntaxKind.ImportKeyword)?(init.arguments[0] as ts.StringLiteral).text:undefined;
      if(mod==='better-sqlite3'){if(ts.isIdentifier(n.name))sqlite.add(n.name.text);else if(ts.isObjectBindingPattern(n.name))for(const e of n.name.elements)sqlite.add((e.name as ts.Identifier).text);}
      if(mod&&/(^|\/)db(\.[mc]?[jt]s)?$/.test(mod)&&ts.isObjectBindingPattern(n.name))for(const e of n.name.elements)if(((e.propertyName??e.name) as ts.Identifier).text==='openDb')openers.add((e.name as ts.Identifier).text);}
    if(ts.isPropertyAccessExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='process'&&n.name.text==='argv')argv=true;
    if(ts.isElementAccessExpression(n)&&n.getText(sf).startsWith('process.argv[')&&ts.isNumericLiteral(n.argumentExpression))positional=true;
    if((ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))&&/^(--db|--database|db|database|DB_PATH)$/.test(n.text))dbFlag=true;
    if(ts.isPropertyAccessExpression(n)&&/^(DB_PATH|db|database)$/.test(n.name.text)&&/^(process\.env|a|args|opts|argv)$/.test(n.expression.getText(sf)))dbFlag=true;
  });
  const guards:ts.Node[]=[],opens:ts.Node[]=[];
  walk(sf,n=>{
    if(ts.isCallExpression(n)){const c=calleeName(n.expression);if(c&&GUARDS.has(c))guards.push(n);if(c&&(openers.has(c)||(ts.isIdentifier(n.expression)&&sqlite.has(c))))opens.push(n);}
    if(ts.isNewExpression(n)&&ts.isIdentifier(n.expression)&&sqlite.has(n.expression.text))opens.push(n);
  });
  const memory=(o:ts.Node)=>{const a=(o as ts.CallExpression).arguments?.[0];return !!a&&ts.isStringLiteral(a)&&a.text===':memory:';};
  const unguarded=opens.filter(o=>!memory(o)&&!guards.some(g=>g.getEnd()<=o.getStart(sf)||(g.getStart(sf)>=o.getStart(sf)&&g.getEnd()<=o.getEnd())));
  return {opens:opens.length,guards:guards.length,cli:shebang||argv,takesDb:dbFlag||opens.length>0, // 位置参数（process.argv[n]）只有在同一文件里打开库时才算库路径（filter-sample 的 argv[2] 是词表）
    positional,unguarded:unguarded.map(o=>`${file}:${sf.getLineAndCharacterOfPosition(o.getStart(sf)).line+1} ${o.getText(sf).slice(0,60)}`)};
}
export function collect(root:string){const out:string[]=[];const visit=(d:string)=>{for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const r=path.posix.join(d,e.name);if(e.name==='node_modules')continue;if(e.isDirectory())visit(r);else if(EXT.test(e.name))out.push(r);}};for(const d of ['scripts','server/src'])if(fs.existsSync(path.join(root,d)))visit(d);return out.sort();}
/** 在审计范围内：scripts/ 下全部；server/src 下是 CLI（shebang / process.argv）且打开库的入口；服务 main.ts 豁免。 */
export function audit(root:string){const files=collect(root),scope:string[]=[],failures:string[]=[];
  for(const f of files){if(EXEMPT.has(f))continue;const a=analyze(f,fs.readFileSync(path.join(root,f),'utf8'));
    const inScope=f.startsWith('scripts/')?a.takesDb:(a.cli&&a.opens>0);if(!inScope)continue;scope.push(f);
    if(a.unguarded.length)failures.push(...a.unguarded.map(u=>'unguarded open: '+u));}
  return {scope,failures};}
it('every real CLI that opens a db guards it first; the scope is exactly the known set',()=>{
  const r=audit(process.cwd());expect(r.failures).toEqual([]);
  expect(r.scope).toEqual(['scripts/ai-content-export.ts','scripts/ai-content-import.ts','scripts/ai-generate.ts','scripts/ai-review.ts','scripts/freq-daily.ts','scripts/freq-zk-rank.ts','scripts/import-forms.ts','scripts/seed-due.ts','scripts/verify-migration.ts','server/src/import.ts']);
});
it('guard wrappers really call the protection predicate; library openers guard internally',()=>{
  const body=(file:string,name:string)=>{const sf=parse(file,fs.readFileSync(file,'utf8'));let found='';walk(sf,n=>{if(ts.isFunctionDeclaration(n)&&n.name?.text===name)found=n.getText(sf);});expect(found,`${file} ${name}`).not.toBe('');return found;};
  const calls=(file:string,text:string,name:string)=>{let hit=false;walk(parse(file,text),n=>{if(ts.isCallExpression(n)&&calleeName(n.expression)===name)hit=true;});return hit;};
  expect(calls('x.ts',body('server/src/ai/cli.ts','dbArg'),'protectTarget')).toBe(true);
  expect(calls('x.ts',body('server/src/guard.ts','protectTarget'),'isProduction')).toBe(true);
  expect(calls('x.ts',body('server/src/guard.ts','productionGate'),'isProduction')).toBe(true);
  for(const [file,fn] of [['server/src/ai/transfer.ts','importFile'],['server/src/ai/transfer.ts','exportFile'],['scripts/verify-migration.ts','verifyMigration']]){const a=analyze('x.ts',`import Database from 'better-sqlite3';import {openDb} from './db.ts';\n`+body(file,fn));expect(a.opens,fn).toBeGreaterThan(0);expect(a.unguarded,fn).toEqual([]);}
});
it.each([['scripts/seed-due.ts',/protectTarget\(dbPath\);/,'void dbPath;'],['scripts/freq-zk-rank.ts',/dbArg\(a\)/,"required(a,'db')"],['scripts/ai-generate.ts',/dbArg\(a\)/,"required(a,'db')"],['server/src/import.ts',/const gate = productionGate\([^;]*;/,'const gate = {backup:undefined as string|undefined};'],['scripts/verify-migration.ts',/productionGate\(file[^;]*;/,'']])('mutation: removing the guard from %s fails the audit (also when left in a comment)',(file,re,rep)=>{
  const text=fs.readFileSync(file,'utf8');expect(re.test(text)).toBe(true);
  for(const m of [text.replace(re,rep),text.replace(re,m=>`/* ${m} */ ${rep}`),text.replace(re,m=>`${rep} const s=${JSON.stringify(m)};`)]){
    const a=analyze(file,m);expect(a.unguarded.length,file).toBeGreaterThan(0);}
});
const NOGUARD:Record<string,string>={
  'scripts/new-thing.ts':"import {openDb} from '../server/src/db.ts';\nconst i=process.argv.indexOf('--db');openDb(process.argv[i+1]);",
  'scripts/new-late.ts':"import {openDb} from '../server/src/db.ts';\nimport {protectTarget} from '../server/src/guard.ts';\nconst f=process.argv[process.argv.indexOf('--db')+1];const db=openDb(f);protectTarget(f);",
  'scripts/new-comment.ts':"import {openDb} from '../server/src/db.ts';\n// protectTarget(f) first!\nconst f=process.argv[process.argv.indexOf('--db')+1];openDb(f);",
  'scripts/new-js.js':"import Database from 'better-sqlite3';\nconst db=new Database(process.argv[process.argv.indexOf('--db')+1]);",
  'scripts/new-cjs.cjs':"const Sqlite=require('better-sqlite3');\nconst db=new Sqlite(process.argv[process.argv.indexOf('--database')+1]);",
  'scripts/sub/new-sub.ts':"import {openDb as open} from '../../server/src/db.ts';\nopen(process.argv[process.argv.indexOf('--db')+1]);",
  'server/src/new-cli.ts':"#!/usr/bin/env tsx\nimport {openDb} from './db.ts';\nopenDb(process.argv[2]);",
  'scripts/new-arg.ts':"import {openDb} from '../server/src/db.ts';\nconst f=process.argv[process.argv.indexOf('--database')+1];openDb(f);",
  'scripts/new-pos.mts':"const {default:D}=await import('better-sqlite3');\nconst db=D(process.argv[2]);",
  'scripts/new-env.ts':"import {openDb} from '../server/src/db.ts';\nopenDb(process.env.DB_PATH ?? 'data/vocab.db');",
};
it.each(Object.keys(NOGUARD))('synthetic %s without a real guard is found and fails; with a guard first it passes',name=>{
  const root=temp('audit-');try{fs.mkdirSync(path.join(root,'scripts'),{recursive:true});fs.mkdirSync(path.join(root,'server/src'),{recursive:true});
    fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),NOGUARD[name]);
    const bad=audit(root);expect(bad.scope).toContain(name);expect(bad.failures.length,JSON.stringify(bad)).toBeGreaterThan(0);
    const fixed=NOGUARD[name].replace(/^((?:#!.*\n)?(?:.*(?:import|require)[^\n]*\n)+)/,"$1import {protectTarget} from 'g';protectTarget(process.argv[2]);\n");
    fs.writeFileSync(path.join(root,name),fixed.replace('protectTarget(f);',''));expect(audit(root).failures,fixed).toEqual([]);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
it('non-CLI server modules and in-memory opens are out of scope',()=>{
  expect(analyze('server/src/x.ts',"import {openDb} from './db.ts';export const f=(p:string)=>openDb(p);").cli).toBe(false);
  expect(analyze('scripts/x.ts',"import Database from 'better-sqlite3';new Database(':memory:');").unguarded).toEqual([]);
});
