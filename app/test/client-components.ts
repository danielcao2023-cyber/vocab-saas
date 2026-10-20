import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { parse, compileScript } from 'vue/compiler-sfc';
const nativeRequire = createRequire(import.meta.url);
/** Compile trusted local SFCs as client components for Vue's custom renderer.
 * Vitest's standard Vue plugin emits SSR components, which are separately tested with renderToString.
 */
export function clientComponent(file: string): any {
  const cache = new Map<string, any>();
  function load(filename: string): any {
    if (cache.has(filename)) return cache.get(filename);
    const source = fs.readFileSync(filename, 'utf8');
    // The custom host has no HTML parser/insertStaticContent; keep static nodes explicit in tests.
    const content = filename.endsWith('.vue') ? compileScript(parse(source, { filename }).descriptor, { id: filename, inlineTemplate: true, templateOptions: {compilerOptions: {hoistStatic: false}} }).content : source;
    const js = ts.transpileModule(content, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const mod: { exports: any } = { exports: {} };cache.set(filename,mod.exports);
    const require = (name: string) => {
      if (!name.startsWith('.')) return nativeRequire(name);
      let target = path.resolve(path.dirname(filename), name);
      if (!path.extname(target)) target += '.ts';
      return load(target);
    };
    new Function('require', 'module', 'exports', js)(require,mod,mod.exports);
    return mod.exports;
  }
  return load(path.resolve(file)).default;
}
