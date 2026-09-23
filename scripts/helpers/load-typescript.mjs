import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
/** Load real, side-effect-free UI modules for Node tests without copying their logic. */
export function loadTypeScript(path, globals = {}) {
  const cache = new Map();
  function load(file) {
    file = resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    } }).outputText;
    const scopedRequire = name => {
      if (!name.startsWith('.')) return require(name);
      let next = resolve(dirname(file), name);
      if (next.endsWith('.js')) next = next.slice(0, -3) + '.ts';
      if (!existsSync(next)) next = existsSync(next + '.ts') ? next + '.ts' : resolve(next, 'index.ts');
      if (statSync(next).isDirectory()) next = resolve(next, 'index.ts');
      return load(next);
    };
    runInNewContext(source, { module, exports: module.exports, require: scopedRequire,
      navigator: { languages: ['en'], language: 'en' }, console, ...globals }, { filename: file });
    return module.exports;
  }
  return load(path);
}
