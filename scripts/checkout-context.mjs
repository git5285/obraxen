import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readOperationalClaims } from '../automation/agents/operations.mjs';
import { loadPolicy } from '../automation/agents/policy.mjs';
import { claimContentDigest } from '../automation/agents/claims.mjs';

export function checkoutContext(repo, { expectedHead, expectedRoot, requireClean = false, compact = false,
  task, stateHome = loadPolicy().coordination.stateHome } = {}) {
  const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }).trimEnd();
  const root = realpathSync(git(['rev-parse', '--show-toplevel']));
  assert.equal(realpathSync(repo), root, 'Run from the selected checkout root');
  if (expectedRoot) assert.equal(root, realpathSync(expectedRoot), 'Unexpected checkout root');
  const controlRoot = dirname(resolve(root, git(['rev-parse', '--path-format=absolute', '--git-common-dir'])));
  const designation = join(controlRoot, 'WORKING_CHECKOUT.md');
  const head = git(['rev-parse', 'HEAD']);
  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  if (expectedHead) assert.equal(head, expectedHead, 'Unexpected checkout HEAD');
  if (requireClean) assert.equal(status, '', 'Checkout has pending changes');
  const result = { root, controlRoot, checkoutRole: root === controlRoot ? 'control' : 'worktree',
    designationFile: existsSync(designation) ? designation : null,
    head, branch: git(['branch', '--show-current']) || null,
    dirty: Boolean(status), status: status.split('\n').filter(Boolean),
    home: 'apps/public-site/', legacy: existsSync(join(root, 'src/app/[lang]/layout.tsx')) ? 'src/' : null, automation: 'automation/agents/',
    remoteState: 'not-queried', publicationAuthorized: false };
  if (compact || task) {
    const claims = readOperationalClaims(root, stateHome);
    const current = task ? claims.find(claim => claim.threadId === task) : null;
    const markerPath = current ? join(controlRoot, current.claim.source) : null;
    const marker = markerPath && existsSync(markerPath) ? readFileSync(markerPath, 'utf8') : '';
    const markerIntegrity = !marker ? 'unavailable' : claimContentDigest(marker) === current.claim.contentDigest ? 'verified' : 'changed';
    const field = key => markerIntegrity === 'verified' ? marker.match(new RegExp(`^- ${key}: (.+)$`, 'm'))?.[1] ?? null : null;
    result.task = task ? { id: task, owner: current?.threadId ?? null, state: current?.state ?? 'unregistered',
      markerIntegrity,
      checkout: field('checkout'), initialHead: field('head'),
      selectedCheckoutMatches: field('checkout') ? field('checkout') === root : null,
      nextStep: markerIntegrity === 'changed' ? 'Marcador alterado: resolver la discrepancia antes de continuar.'
        : current?.state === 'liberado' ? 'Trabajo local cerrado; entrega remota no autorizada por este informe.'
        : current?.state === 'esperando_revision' ? 'Revisar la candidata y su evidencia antes de liberar.'
          : field('siguiente_paso') ?? 'Consultar la claim; no inferir propiedad ni candidata.',
      paths: current?.claim.files ?? [] } : null;
    result.activeOwners = claims.filter(claim => claim.state !== 'liberado')
      .map(claim => ({ owner: claim.threadId, state: claim.state, paths: claim.claim.files }));
    result.ownershipScope = 'Registered operational claims; editing still requires preflight and legacy-claim checks.';
    if (compact) {
      result.changeCount = result.status.length;
      result.status = result.status.slice(0, 8);
      result.statusTruncated = result.changeCount > result.status.length;
    }
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert(args.every(arg => ['--require-clean', '--compact'].includes(arg) || /^--expected-head=[a-f0-9]{40}$/.test(arg)
    || /^--expected-root=.+$/.test(arg) || /^--task=[A-Za-z0-9_-]+$/.test(arg)), 'Unknown checkout option');
  console.log(JSON.stringify(checkoutContext(process.cwd(), {
    expectedHead: args.find(arg => arg.startsWith('--expected-head='))?.slice(16),
    expectedRoot: args.find(arg => arg.startsWith('--expected-root='))?.slice(16),
    requireClean: args.includes('--require-clean'),
    compact: args.includes('--compact'),
    task: args.find(arg => arg.startsWith('--task='))?.slice(7),
  }), null, 2));
}
