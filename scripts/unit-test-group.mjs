import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const GROUPS = ['home', 'tooling', 'publication'];

export function validateGroups(groups, discovered) {
  assert.deepEqual(Object.keys(groups).sort(), [...GROUPS].sort(), 'unknown or missing test group');
  const assigned = [];
  for (const group of GROUPS) {
    assert(Array.isArray(groups[group]), `invalid test group: ${group}`);
    for (const file of groups[group]) {
      assert(typeof file === 'string' && /^tests\/(?:[\w-]+\/)*[\w-]+\.test\.tsx?$/.test(file), 'invalid test path');
      assigned.push(file);
    }
  }
  assert.equal(new Set(assigned).size, assigned.length, 'test assigned to more than one group');
  assert.deepEqual([...assigned].sort(), [...discovered].sort(), 'unassigned or stale test inventory');
  return groups;
}

export function readGroups(repo) {
  const discovered = readdirSync(resolve(repo, 'tests'), { recursive: true })
    .filter(path => /\.test\.tsx?$/.test(path)).map(path => `tests/${path}`);
  return validateGroups(JSON.parse(readFileSync(resolve(repo, 'tests/unit-test-groups.json'), 'utf8')), discovered);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [group, ...options] = process.argv.slice(2);
  assert(GROUPS.includes(group) && (options.length === 0 || (options.length === 1 && options[0] === '--list')),
    'Use unit-test-group.mjs home|tooling|publication [--list]');
  const repo = fileURLToPath(new URL('../', import.meta.url));
  const files = readGroups(repo)[group];
  assert(files.length > 0, `empty test group: ${group}`);
  if (options[0] === '--list') console.log(JSON.stringify({ group, files }, null, 2));
  else {
    const result = spawnSync(process.execPath, [resolve(repo, 'node_modules/vitest/vitest.mjs'), 'run', ...files],
      { cwd: repo, stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
}
