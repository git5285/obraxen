import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function checkoutContext(repo, { expectedHead, requireClean = false } = {}) {
  const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }).trimEnd();
  const root = realpathSync(git(['rev-parse', '--show-toplevel']));
  assert.equal(realpathSync(repo), root, 'Run from the selected checkout root');
  const head = git(['rev-parse', 'HEAD']);
  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  if (expectedHead) assert.equal(head, expectedHead, 'Unexpected checkout HEAD');
  if (requireClean) assert.equal(status, '', 'Checkout has pending changes');
  return { root, head, branch: git(['branch', '--show-current']) || null,
    dirty: Boolean(status), status: status.split('\n').filter(Boolean),
    home: 'apps/public-site/', legacy: 'src/', remoteState: 'not-queried', publicationAuthorized: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert(args.every(arg => arg === '--require-clean' || /^--expected-head=[a-f0-9]{40}$/.test(arg)), 'Unknown checkout option');
  console.log(JSON.stringify(checkoutContext(process.cwd(), {
    expectedHead: args.find(arg => arg.startsWith('--expected-head='))?.slice(16),
    requireClean: args.includes('--require-clean'),
  }), null, 2));
}
