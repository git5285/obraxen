import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { constants, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectRuntime } from '../automation/agents/runtime.mjs';
import { assertHomeContract, HOME_ROUTES } from './home-contract.mjs';
import { inventory, sha256, sourceFile } from './public-site-evidence.mjs';

const ROOT_INPUTS = [
  '.nvmrc', '.npmrc', 'package.json', 'package-lock.json',
  'automation/agents/runtime.mjs', 'automation/agents/runtime-probe.mjs',
  'scripts/public-site.mjs', 'scripts/home-contract.mjs', 'scripts/public-site-evidence.mjs',
  'scripts/patch-vercel-bundles.mjs', 'scripts/scoped-command.mjs',
];
const APP_INPUTS = [
  'package.json', 'next.config.mjs', 'generate-route-content.mjs',
  'app/route.js', 'app/en/route.js', 'app/de/route.js',
];
const excluded = ['src/', 'data/', 'css/', 'img/', '.git/', '.coordination/', '.github/',
  '.env*', '.vercel/project.json', 'legacy Next configuration', 'legacy APIs'];
const deploymentConfig = {
  '$schema': 'https://openapi.vercel.sh/vercel.json',
  framework: 'nextjs', buildCommand: 'npm run build', outputDirectory: 'apps/public-site/.next',
  installCommand: 'npm ci --ignore-scripts', git: { deploymentEnabled: false },
};
const git = (repo, args) => execFileSync('git', args, {
  cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, maxBuffer: 16 * 1024 * 1024,
}).trim();

export function candidateInputs(repo) {
  const paths = [...ROOT_INPUTS, ...APP_INPUTS.map(path => 'apps/public-site/' + path),
    ...inventory(join(repo, 'apps/public-site/public')).map(file => 'apps/public-site/public/' + file.path)].sort();
  return paths.map(path => {
    const bytes = readFileSync(sourceFile(repo, path));
    assert(!bytes.subarray(0, 80).toString().startsWith('version https://git-lfs.github.com/spec/v1'),
      `unresolved LFS pointer: ${path}`);
    return { path, bytes: bytes.length, sha256: sha256(bytes) };
  });
}

export function assertBuiltHome(root) {
  const app = join(root, 'apps/public-site');
  const routes = JSON.parse(readFileSync(join(app, '.next/server/app-paths-manifest.json'), 'utf8'));
  const exposed = Object.keys(routes).filter(path => !['/_not-found/page', '/_global-error/page'].includes(path)).sort();
  assert.deepEqual(exposed, ['/de/route', '/en/route', '/route'], 'candidate build contains unexpected routes');
  const htmlHash = sha256(readFileSync(join(app, 'public/index.html')));
  for (const name of ['index', 'en', 'de']) {
    assert.equal(sha256(readFileSync(join(app, '.next/server/app', name + '.body'))), htmlHash, `built HTML differs: ${name}`);
  }
  return { routes: HOME_ROUTES, htmlSha256: htmlHash, result: 'passed' };
}

export function prepareHomeCandidate({ repo, destination, allowWorktree = false, build = true }) {
  repo = realpathSync(repo);
  destination = resolve(destination);
  assert(!existsSync(destination), 'destination must not exist; nothing is overwritten');
  const parent = realpathSync(dirname(destination));
  destination = join(parent, destination.slice(dirname(destination).length + 1));
  const within = relative(repo, destination);
  assert(within.startsWith('..' + '/') || isAbsolute(within), 'destination must be outside the source checkout');
  const contract = assertHomeContract(join(repo, 'apps/public-site'));
  const baseCommit = git(repo, ['rev-parse', 'HEAD']);
  const status = git(repo, ['status', '--porcelain=v1', '--untracked-files=all']);
  const inputs = candidateInputs(repo);
  // A clean status alone can hide ignored files or assume-unchanged entries.
  const inputsMatchCommit = inputs.every(file => {
    try {
      const committed = execFileSync('git', ['show', `${baseCommit}:${file.path}`], {
        cwd: repo, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
      });
      const pointer = /^version https:\/\/git-lfs.github.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize (\d+)\n?$/.exec(committed.toString());
      return pointer ? pointer[1] === file.sha256 && Number(pointer[2]) === file.bytes : sha256(committed) === file.sha256;
    } catch { return false; }
  });
  const dirty = Boolean(status) || !inputsMatchCommit;
  assert(allowWorktree || !dirty, 'dirty worktree: commit reviewed inputs or explicitly use --allow-worktree for local evidence only');
  const runtime = build ? inspectRuntime(repo) : null;
  assert(!build || runtime?.ok, 'local pinned dependencies and runtime must pass before building');
  const manifest = {
    schemaVersion: 1, kind: 'home-only-local-candidate', createdAt: new Date().toISOString(),
    source: { baseCommit, exactCommit: dirty ? null : baseCommit, dirty, inputsMatchCommit,
      localStatus: status.split('\n').filter(Boolean), inputsSha256: sha256(JSON.stringify(inputs)) },
    inputs, contract, exclusions: excluded, runtimeFingerprint: runtime?.fingerprint ?? null,
    recipeSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    build: { command: 'npm run build', output: 'apps/public-site/.next', result: 'not-run' },
    routes: HOME_ROUTES, vercelBuildOutput: 'not-generated', publicationAuthorized: false,
  };
  // Claim the new destination atomically. Failures retain inspectable evidence; never clean up user files.
  mkdirSync(destination);
  const save = () => writeFileSync(join(destination, 'home-candidate.json'), JSON.stringify(manifest, null, 2) + '\n');
  save();
  try {
    for (const file of inputs) {
      const target = join(destination, file.path);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(sourceFile(repo, file.path), target, constants.COPYFILE_EXCL);
      assert.equal(sha256(readFileSync(target)), file.sha256, `input changed while copying: ${file.path}`);
    }
    writeFileSync(join(destination, 'vercel.json'), JSON.stringify(deploymentConfig, null, 2) + '\n', { flag: 'wx' });
    assert.deepEqual(candidateInputs(destination), inputs, 'exported inputs differ');
    if (build) {
      cpSync(join(repo, 'node_modules'), join(destination, 'node_modules'), {
        recursive: true, errorOnExist: true, force: false, verbatimSymlinks: true, mode: constants.COPYFILE_FICLONE,
      });
      // No inherited application secrets or activation switches. No install or platform call.
      const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'TEMP', 'SYSTEMROOT'].filter(key => process.env[key])
        .map(key => [key, process.env[key]]));
      env.NEXT_TELEMETRY_DISABLED = '1';
      const result = spawnSync(process.execPath, ['automation/agents/runtime.mjs', 'exec', '--',
        'node', 'scripts/public-site.mjs', 'build'], { cwd: destination, env, stdio: 'inherit' });
      assert(!result.error && result.status === 0, 'isolated Home build failed');
      manifest.build = { ...manifest.build, ...assertBuiltHome(destination) };
    }
    assert.deepEqual(candidateInputs(repo), inputs, 'source inputs changed during preparation');
    assert.deepEqual(candidateInputs(destination), inputs, 'candidate inputs changed during build');
    assert.equal(git(repo, ['rev-parse', 'HEAD']), baseCommit, 'source HEAD changed');
    assert.equal(git(repo, ['status', '--porcelain=v1', '--untracked-files=all']), status, 'source status changed');
    manifest.result = build ? 'built-local' : 'source-only';
    save();
    return manifest;
  } catch (error) {
    manifest.result = 'failed';
    manifest.error = error.message;
    save();
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert(args.every(arg => arg.startsWith('--output=') || ['--allow-worktree', '--source-only'].includes(arg)), 'unknown preparation option');
  const destination = args.find(arg => arg.startsWith('--output='))?.slice(9);
  assert(destination, 'Use --output=<new directory outside checkout> [--allow-worktree] [--source-only]');
  const manifest = prepareHomeCandidate({ repo: fileURLToPath(new URL('../', import.meta.url)), destination,
    allowWorktree: args.includes('--allow-worktree'), build: !args.includes('--source-only') });
  console.log(JSON.stringify({ destination: resolve(destination), result: manifest.result,
    inputsSha256: manifest.source.inputsSha256, exactCommit: manifest.source.exactCommit,
    publicationAuthorized: false }, null, 2));
}
