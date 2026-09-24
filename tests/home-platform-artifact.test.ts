import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { auditPlatform, preparePlatform } from '../scripts/home-platform-artifact.mjs';
import { inventory, sha256 } from '../scripts/public-site-evidence.mjs';
const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, {recursive: true, force: true}); });
const html = `<meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="form-action 'none'"><a href="mailto:info@obraxen.com">Contact</a>`;
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'obraxen-platform-')); temporary.push(root);
  const put = (path: string, content: unknown) => {mkdirSync(dirname(join(root, path)), {recursive: true}); writeFileSync(join(root, path), typeof content === 'string' ? content : JSON.stringify(content));};
  put('apps/public-site/public/index.html', html);
  for (const route of ['route.js', 'en/route.js', 'de/route.js']) put('apps/public-site/app/' + route, '// fixture');
  const inputs = inventory(join(root, 'apps')).map(file => ({...file, path: 'apps/' + file.path}));
  const digest = sha256(JSON.stringify(inputs));
  const manifest = {kind: 'home-only-local-candidate', result: 'built-local', build: {result: 'passed'}, inputs,
    source: {inputsSha256: digest, exactCommit: null}};
  put('home-candidate.json', manifest);
  put('vercel.json', {'$schema': 'https://openapi.vercel.sh/vercel.json', framework: 'nextjs', buildCommand: 'npm run build',
    outputDirectory: 'apps/public-site/.next', installCommand: 'npm ci --ignore-scripts', git: {deploymentEnabled: false}});
  const output = '.vercel/output/';
  const config = {version: 3, framework: {slug: 'nextjs'}, crons: [], routes: [{src: '/.*', status: 404}]};
  put(output + 'config.json', config);
  put(output + 'static/index.html', html);
  for (const name of ['index', 'en', 'de']) put(output + 'functions/' + name + '.prerender-fallback.body', html);
  for (const name of ['_global-error', '_global-error.rsc', '_not-found', '_not-found.rsc', 'de', 'de.rsc', 'en', 'en.rsc', 'index', 'index.rsc']) {
    put(output + 'functions/' + name + '.func/.vc-config.json', {environment: {}, runtime: 'nodejs24.x', handler: 'apps/public-site/___next_launcher.cjs', filePathMap: {}});
  }
  const dry = () => {
    const files = inventory(join(root, '.vercel/output')).map(file => ({path: output + file.path, size: file.bytes,
      sha: createHash('sha1').update(readFileSync(join(root, output, file.path))).digest('hex')}));
    return {framework: {slug: 'nextjs'}, files, totalSize: files.reduce((n, file) => n + file.size, 0)};
  };
  return {root, put, digest, manifest, config, dry, options: {root, expectedInputsSha256: digest}};
}
it('audits a complete local artifact without claiming publication or an exact commit', () => {
  const f = fixture(); expect(auditPlatform({...f.options, dryRun: f.dry()})).toMatchObject({result: 'passed', localOnly: true, publicationAuthorized: false});
});
it('prepares only a fresh export and records explicit settings without building', () => {
  const f = fixture();
  // Use a fresh export fixture without generated platform output.
  rmSync(join(f.root, '.vercel'), {recursive: true});
  const options = {...f.options, projectId: 'prj_fixture', orgId: 'team_fixture', target: 'production'};
  expect(preparePlatform(options)).toMatchObject({buildExecuted: false, publicationAuthorized: false, target: 'production'});
  expect(JSON.parse(readFileSync(join(f.root, 'vercel.json'), 'utf8')).installCommand).toBe('npm ls --omit=dev --depth=0');
  expect(() => preparePlatform(options)).toThrow('never overwritten');
});
it('rejects missing identity, unexpected inputs and source-only exports', () => {
  const f = fixture();
  expect(() => preparePlatform({...f.options, projectId: '', orgId: '', target: 'production'})).toThrow('IDs required');
  expect(() => auditPlatform({...f.options, expectedInputsSha256: 'a'.repeat(64), dryRun: f.dry()})).toThrow('Unexpected candidate');
  f.put('home-candidate.json', {...f.manifest, result: 'source-only'});
  expect(() => auditPlatform({...f.options, dryRun: f.dry()})).toThrow('source-only');
});
it.each(['source', 'rendered', 'upload', 'missing', 'extra-static', 'route', 'alias', 'environment', 'function', 'nested-function', 'escape', 'configuration'])(
  'rejects %s drift', kind => {
    const f = fixture(); const dry = f.dry();
    if (kind === 'source') f.put('apps/public-site/public/index.html', html + 'changed');
    if (kind === 'rendered') f.put('.vercel/output/functions/en.prerender-fallback.body', 'stale');
    if (kind === 'upload') dry.files[0].sha = 'a'.repeat(40);
    if (kind === 'missing') {const removed = dry.files.pop()!; dry.totalSize -= removed.size;}
    if (kind === 'extra-static') f.put('.vercel/output/static/legacy.html', 'legacy');
    if (kind === 'route') f.put('.vercel/output/config.json', {...f.config, routes: [{src: '/.*', dest: 'https://example.invalid'}]});
    if (kind === 'alias') f.put('.vercel/output/config.json', {...f.config, routes: [...f.config.routes, {src: '/legacy', dest: '/'}]});
    if (kind === 'configuration') f.put('home-platform.json', {expectedInputsSha256: f.digest, configurationSha256: 'changed'});
    if (kind === 'environment') f.put('.vercel/output/functions/index.func/.vc-config.json', {environment: {TOKEN: 'fixture'}});
    if (kind === 'function') f.put('.vercel/output/functions/api.func/.vc-config.json', {});
    if (kind === 'nested-function') f.put('.vercel/output/functions/legacy/index.func/.vc-config.json', {});
    if (kind === 'escape') {symlinkSync(tmpdir(), join(f.root, '.vercel/output/escape')); dry.files.push({path: '.vercel/output/escape', size: 0, sha: ''});}
    expect(() => auditPlatform({...f.options, dryRun: ['alias', 'extra-static', 'nested-function'].includes(kind) ? f.dry() : dry})).toThrow();
  });
