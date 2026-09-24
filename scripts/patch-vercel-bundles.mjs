import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hash = value => createHash('sha256').update(value).digest('hex');
export const EXTENSION_STUB = 'export async function execExtension() { throw new Error("OBRAXEN: external Vercel CLI extensions are disabled by the reviewed security policy"); }\n';
export const PATCHES = Object.freeze([
  { file: 'exec-4AISDHUV.js', before: '58d4b28e07c2829b4752396a02ad5d71b03c50cf097ecaf54d4a0f09a0790bac',
    after: hash(EXTENSION_STUB), transform: () => EXTENSION_STUB },
  { file: 'chunk-7RMCBXBB.js', before: 'e54ad1d9393bdc7093d38ea82573dc3df923de41cddf12c167cab9f9e72f5837',
    after: 'a797e5479fd2d46f7562e2f59e6d86a35e93ed3aa13ed56cfc4c09dac20cfcb8',
    // Offsets belong to the exact SHA above, never to an arbitrary package version.
    transform: source => source.slice(0, 69229) + '(exports,module){module.exports=require("path-to-regexp");}' + source.slice(76930) },
]);

export function patchBundles(root, mode = 'check') {
  assert(['apply', 'check'].includes(mode), 'Expected apply or check');
  root = realpathSync(root);
  const file = relative => {
    const path = join(root, relative);
    assert(lstatSync(path).isFile(), 'Expected regular file: ' + relative);
    assert(realpathSync(path).startsWith(root + '/'), 'External package path: ' + relative);
    return path;
  };
  const readPackage = name => JSON.parse(readFileSync(file('node_modules/' + name + '/package.json'), 'utf8'));
  assert.equal(readPackage('vercel').version, '59.16.0', 'Vercel version needs a new bundle review');
  assert.equal(readPackage('path-to-regexp').version, '6.3.0', 'Reviewed route parser required');
  // Validate every input before writing anything. Unknown state always fails closed.
  const plans = PATCHES.map(patch => {
    const path = file('node_modules/vercel/dist/chunks/' + patch.file);
    const source = readFileSync(path, 'utf8');
    const digest = hash(source);
    if (digest === patch.after) return { path, changed: false, result: source };
    assert.equal(digest, patch.before, 'Unreviewed bundle: ' + patch.file);
    assert.equal(mode, 'apply', 'Unpatched bundle; run npm run prepare:toolchain');
    const result = patch.transform(source);
    assert.equal(hash(result), patch.after, 'Patch recipe mismatch');
    return { path, changed: true, result };
  });
  for (const plan of plans) if (plan.changed) writeFileSync(plan.path, plan.result);
  return { version: '59.16.0', mode, changed: plans.filter(p => p.changed).length,
    scope: 'two reviewed Vercel bundles; not a general third-party certification' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 3, 'Usage: node scripts/patch-vercel-bundles.mjs apply|check');
  console.log(JSON.stringify(patchBundles(dirname(dirname(fileURLToPath(import.meta.url))), process.argv[2])));
}
