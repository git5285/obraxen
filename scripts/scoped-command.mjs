import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ALIASES = Object.freeze({
  "build": "build:home",
  "dev": "dev:home",
  "start": "start:home",
  "test:published": "test:e2e:home"
});
export function runAlias(alias, options = [], run = spawnSync, log = console.log) {
  assert(Object.hasOwn(ALIASES, alias), 'Unknown application alias');
  const target = ALIASES[alias];
  log(`[scope] ${alias} -> ${target} (Home apps/public-site/)`);
  const result = run('npm', ['run', target, '--', ...options], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit', shell: false,
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runAlias(process.argv[2], process.argv.slice(3));
}
