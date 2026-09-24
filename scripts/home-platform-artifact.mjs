import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory, sha256, sourceFile } from './public-site-evidence.mjs';
import { assertHomeContract } from './home-contract.mjs';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const safePath = path => typeof path === 'string' && path && path !== '.' && !path.includes('\\')
  && !posix.isAbsolute(path) && posix.normalize(path) === path && !path.startsWith('../');
const allowedUpload = path => safePath(path)
  && /^(?:\.vercel\/output\/|node_modules\/|apps\/public-site\/\.next\/)/.test(path)
  && !/(?:^|\/)\.env(?:\.|$)/.test(path);

function candidate(root, expectedInputsSha256, expectedCandidateSha256) {
  assert(/^[a-f0-9]{64}$/.test(expectedInputsSha256 ?? ''), 'Explicit reviewed inputs SHA-256 required');
  assert(/^[a-f0-9]{64}$/.test(expectedCandidateSha256 ?? ''), 'Explicit reviewed candidate SHA-256 required');
  const bytes = readFileSync(sourceFile(root, 'home-candidate.json'));
  assert.equal(sha256(bytes), expectedCandidateSha256, 'Unexpected candidate manifest');
  const manifest = JSON.parse(bytes);
  assert.equal(manifest.kind, 'home-only-local-candidate');
  assert.equal(manifest.result, 'built-local', 'A source-only export is not a platform candidate');
  assert.equal(manifest.build.result, 'passed');
  assert.equal(sha256(JSON.stringify(manifest.inputs)), expectedInputsSha256, 'Unexpected candidate inputs');
  assert.equal(manifest.source.inputsSha256, expectedInputsSha256);
  const source = manifest.source;
  assert(/^[a-f0-9]{40}$/.test(source.baseCommit ?? ''), 'Invalid candidate base commit');
  assert(source.exactCommit === null || /^[a-f0-9]{40}$/.test(source.exactCommit ?? ''), 'Invalid candidate exact commit');
  assert(typeof source.dirty === 'boolean' && typeof source.inputsMatchCommit === 'boolean', 'Invalid candidate source state');
  assert(source.dirty === (source.exactCommit === null)
    && (source.dirty || source.inputsMatchCommit)
    && (source.exactCommit === null || source.exactCommit === source.baseCommit), 'Inconsistent candidate provenance');
  const seen = new Set();
  for (const file of manifest.inputs) {
    assert(!seen.has(file.path), 'Duplicate input'); seen.add(file.path);
    const bytes = readFileSync(sourceFile(root, file.path));
    assert.equal(bytes.length, file.bytes); assert.equal(sha256(bytes), file.sha256, 'Changed candidate input: ' + file.path);
  }
  assertHomeContract(join(root, 'apps/public-site'));
  const publicInputs = manifest.inputs.filter(file => file.path.startsWith('apps/public-site/public/'))
    .map(file => ({ ...file, path: file.path.slice('apps/public-site/public/'.length) }));
  assert.deepEqual(inventory(join(root, 'apps/public-site/public')), publicInputs, 'Unexpected public assets');
  return manifest;
}

// Local export only. No CLI, network, credentials, installation or publication.
export function preparePlatform({ root, expectedInputsSha256, expectedCandidateSha256, projectId, orgId, target }) {
  root = realpathSync(root);
  assert(/^prj_[a-zA-Z0-9]+$/.test(projectId ?? '') && /^team_[a-zA-Z0-9]+$/.test(orgId ?? ''), 'Explicit project/team IDs required');
  assert(['preview', 'production'].includes(target), 'Explicit target required');
  assert(!existsSync(join(root, '.git')), 'Use an isolated export, not a checkout');
  const manifest = candidate(root, expectedInputsSha256, expectedCandidateSha256);
  assert(!existsSync(join(root, '.vercel')), 'Existing platform state is never overwritten');
  assert(!existsSync(join(root, 'home-platform.json')), 'Existing preparation evidence is never overwritten');
  const previous = readJson(sourceFile(root, 'vercel.json'));
  assert.deepEqual(previous, { '$schema': 'https://openapi.vercel.sh/vercel.json', framework: 'nextjs',
    buildCommand: 'npm run build', outputDirectory: 'apps/public-site/.next',
    installCommand: 'npm ci --ignore-scripts', git: { deploymentEnabled: false } }, 'Unexpected export configuration');
  const configuration = { ...previous, installCommand: 'npm ls --omit=dev --depth=0' };
  const project = { projectId, orgId, settings: { framework: 'nextjs', rootDirectory: null,
    buildCommand: configuration.buildCommand, outputDirectory: configuration.outputDirectory,
    installCommand: configuration.installCommand, nodeVersion: '24.x' } };
  mkdirSync(join(root, '.vercel'));
  writeFileSync(join(root, '.vercel/project.json'), JSON.stringify(project, null, 2) + '\n', { flag: 'wx' });
  writeFileSync(join(root, 'vercel.json'), JSON.stringify(configuration, null, 2) + '\n');
  const report = { schemaVersion: 2, contractVersion: '2.0.0', kind: 'home-platform-preparation', expectedInputsSha256, expectedCandidateSha256, projectId, orgId, target,
    exactCommit: manifest.source.exactCommit, configurationSha256: sha256(readFileSync(join(root, 'vercel.json'))),
    projectConfigurationSha256: sha256(readFileSync(join(root, '.vercel/project.json'))),
    buildExecuted: false, publicationAuthorized: false };
  writeFileSync(join(root, 'home-platform.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}

export function auditPlatform({ root, expectedInputsSha256, expectedCandidateSha256, dryRun }) {
  root = realpathSync(root);
  const manifest = candidate(root, expectedInputsSha256, expectedCandidateSha256);
  let association = null;
  if (existsSync(join(root, 'home-platform.json'))) {
    association = readJson(sourceFile(root, 'home-platform.json'));
    assert.equal(association.expectedInputsSha256, expectedInputsSha256, 'Preparation inputs changed');
    assert.equal(association.expectedCandidateSha256, expectedCandidateSha256, 'Preparation candidate changed');
    assert.equal(association.configurationSha256, sha256(readFileSync(sourceFile(root, 'vercel.json'))), 'Platform configuration drift');
    assert.equal(association.projectConfigurationSha256, sha256(readFileSync(sourceFile(root, '.vercel/project.json'))), 'Project configuration drift');
  }
  const realFile = path => {
    assert(safePath(path), 'Unsafe artifact path');
    const actual = realpathSync(join(root, path));
    assert(actual.startsWith(root + '/'), 'External traced path: ' + path);
    return actual;
  };
  const output = '.vercel/output/';
  const config = readJson(realFile(output + 'config.json'));
  assert.equal(config.version, 3); assert.equal(config.framework?.slug, 'nextjs');
  assert.deepEqual(config.crons ?? [], []);
  assert.deepEqual(config.images?.domains ?? [], []);
  assert.deepEqual(config.images?.remotePatterns ?? [], []);
  assert(!config.wildcard && !config.middleware, 'Unexpected platform routing');
  for (const route of config.routes ?? []) {
    assert(!route.middlewarePath && !route.middleware, 'Unexpected middleware');
    if (route.dest) assert(new Set(['/', '/404', '/500', '/index.rsc', '/index.segments/$segmentPath.segment.rsc',
      '/$path.segments/$segmentPath.segment.rsc', '/$1.rsc', '/__index.prefetch.rsc', '/$1.prefetch.rsc',
      '/_next/static/not-found.txt', '/$path.rsc']).has(route.dest), 'Unexpected route destination');
    if (route.dest === '/') assert.equal(route.src, '/index(\\.action|\\.rsc)', 'Unexpected Home alias');
    if (route.dest === '/index.rsc') assert(['^/?', '/\\.rsc$'].includes(route.src), 'Unexpected RSC alias');
    if (route.dest === '/index.segments/$segmentPath.segment.rsc') assert.equal(route.src, '^/?$');
    if (route.dest === '/__index.prefetch.rsc') assert.equal(route.src, '/\\.prefetch\\.rsc$');
    assert(!/https?:|\/api(?:\/|$)/.test(JSON.stringify(route)), 'External or API route');
  }
  assert((config.routes ?? []).some(route => route.src === '/.*' && route.status === 404 && !route.dest), 'Missing closed route fallback');
  const expectedFunctions = ['_global-error', '_global-error.rsc', '_not-found', '_not-found.rsc', 'de', 'de.rsc', 'en', 'en.rsc', 'index', 'index.rsc'].map(name => name + '.func').sort();
  assert.deepEqual(readdirSync(join(root, output, 'functions')).filter(name => name.endsWith('.func')).sort(), expectedFunctions);
  for (const name of expectedFunctions) {
    const fn = readJson(realFile(output + 'functions/' + name + '/.vc-config.json'));
    assert.deepEqual(fn.environment, {}, 'Embedded function environment');
    assert.equal(fn.runtime, 'nodejs24.x');
    assert.equal(fn.handler, 'apps/public-site/___next_launcher.cjs');
    for (const [from, to] of Object.entries(fn.filePathMap ?? {})) {
      assert(allowedUpload(from) && allowedUpload(to), 'Unexpected function file mapping');
    }
  }
  const htmlHash = sha256(readFileSync(sourceFile(root, 'apps/public-site/public/index.html')));
  for (const name of ['index', 'en', 'de']) assert.equal(sha256(readFileSync(realFile(output + 'functions/' + name + '.prerender-fallback.body'))), htmlHash, 'Rendered HTML differs');
  for (const file of manifest.inputs.filter(file => file.path.startsWith('apps/public-site/public/'))) {
    assert.equal(sha256(readFileSync(realFile(output + 'static/' + file.path.slice('apps/public-site/public/'.length)))), file.sha256, 'Public asset differs');
  }
  assert.equal(dryRun.framework?.slug, 'nextjs');
  assert(Array.isArray(dryRun.files) && dryRun.files.length > 0, 'Empty upload inventory');
  const uploaded = new Set(); const names = new Set(); let bytes = 0;
  for (const file of dryRun.files) {
    assert(allowedUpload(file.path), 'Excluded upload: ' + file.path);
    assert(!names.has(file.path), 'Duplicate upload'); names.add(file.path);
    const actual = realFile(file.path);
    const link = lstatSync(join(root, file.path)).isSymbolicLink();
    assert(link || statSync(actual).isFile(), 'Upload must be a file or internal link');
    const content = link ? Buffer.from(readlinkSync(join(root, file.path))) : readFileSync(actual);
    assert.equal(createHash('sha1').update(content).digest('hex'), file.sha, 'Upload digest differs');
    assert.equal(content.length, file.size, 'Upload size differs'); bytes += content.length;
    uploaded.add(actual);
  }
  const ancestors = new Set();
  const expectedStatic = new Set(manifest.inputs.filter(file => file.path.startsWith('apps/public-site/public/'))
    .map(file => file.path.slice('apps/public-site/public/'.length)));
  // Match framework assets to the local Next build, not an open URL namespace.
  // The adapter adds only one synthetic static response (see @vercel/next).
  const generatedStatic = new Map();
  const nextStatic = join(root, 'apps/public-site/.next/static');
  if (existsSync(nextStatic)) for (const file of inventory(nextStatic)) {
    assert(!/\.html?$/i.test(file.path), 'Unexpected HTML in framework assets');
    generatedStatic.set('_next/static/' + file.path, file.sha256);
  }
  generatedStatic.set('_next/static/not-found.txt', sha256('Not Found'));
  function inspect(path) {
    const actual = realFile(path);
    if (path.startsWith(output + 'functions/') && path.endsWith('.func')) {
      const name = path.slice((output + 'functions/').length);
      assert(expectedFunctions.includes(name)
        || /^(?:_global-error|_not-found)\.segments\/(?:_not-found\/)?(?:__PAGE__|_full|_tree)\.segment\.rsc\.func$/.test(name), 'Unexpected nested function');
    }
    if (statSync(actual).isDirectory()) {
      assert(!ancestors.has(actual), 'Cyclic artifact directory');
      ancestors.add(actual);
      for (const name of readdirSync(actual)) inspect(path + '/' + name);
      ancestors.delete(actual);
    } else {
      assert(uploaded.has(actual), 'Output missing from upload inventory: ' + path);
      if (path.startsWith(output + 'static/')) {
        const relative = path.slice((output + 'static/').length);
        assert(expectedStatic.has(relative) || generatedStatic.has(relative)
          || /^(404|500)(?:\.html|\.rsc\.json|\.segments\/.*)$/.test(relative), 'Unexpected public output');
        if (generatedStatic.has(relative)) {
          assert.equal(sha256(readFileSync(actual)), generatedStatic.get(relative), 'Generated static asset differs');
        }
      }
    }
  }
  inspect('.vercel/output');
  assert.equal(dryRun.totalSize, bytes, 'Upload total differs');
  return { schemaVersion: 2, contractVersion: '2.0.0', kind: 'home-platform-audit', result: 'passed', expectedInputsSha256, expectedCandidateSha256,
    exactCommit: manifest.source.exactCommit, localOnly: !manifest.source.exactCommit,
    uploadFiles: names.size, uploadBytes: bytes, artifactManifestSha256: sha256(JSON.stringify(dryRun.files)),
    configurationSha256: sha256(readFileSync(sourceFile(root, 'vercel.json'))),
    association: association ? {projectId: association.projectId, orgId: association.orgId, target: association.target, remoteVerified: false} : null,
    routes: ['/', '/en', '/de'], publicationAuthorized: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [operation, ...args] = process.argv.slice(2);
  const options = {};
  for (const arg of args) {
    const match = /^--(root|inputs-sha256|candidate-sha256|project-id|org-id|target|dry-run)=(.+)$/.exec(arg);
    assert(match && !Object.hasOwn(options, match[1]), 'Unknown or duplicate option'); options[match[1]] = match[2];
  }
  assert(options.root, 'Explicit export root required');
  const base = {root: options.root, expectedInputsSha256: options['inputs-sha256'], expectedCandidateSha256: options['candidate-sha256']};
  assert(['prepare', 'audit'].includes(operation), 'Use prepare|audit');
  const report = operation === 'prepare' ? preparePlatform({...base, projectId: options['project-id'], orgId: options['org-id'], target: options.target})
    : auditPlatform({...base, dryRun: readJson(options['dry-run'])});
  console.log(JSON.stringify(report, null, 2));
}
