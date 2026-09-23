import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// One-off, explicitly invoked source recovery. GET requests only. Never deploys.
const root = process.cwd();
const directory = resolve(root, '.vercel/approved-home-recovery-20260923');
const descriptor = JSON.parse(readFileSync(resolve(directory, 'source-files.json'), 'utf8'));
const hash = (data, algorithm = 'sha256') => createHash(algorithm).update(data).digest('hex');
const beforePath = resolve(directory, 'control-before.json');
if (!existsSync(beforePath)) {
  const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean);
  const files = Object.fromEntries([...new Set(paths)].filter(path => existsSync(path) && statSync(path).isFile()).map(path => [path, hash(readFileSync(path))]));
  writeFileSync(beforePath, JSON.stringify({capturedAt:new Date().toISOString(), files}, null, 2) + '\n', {flag:'wx'});
}
const contents = new Map();
const manifest = [];
for (const file of descriptor.files) {
  if (file.path.includes('..') || file.path.startsWith('/')) throw new Error('Unsafe source path');
  const destination = resolve(directory, 'original', file.path);
  let bytes = existsSync(destination) ? readFileSync(destination) : contents.get(file.uid);
  if (!bytes) {
    const endpoint = `/v7/deployments/${descriptor.deploymentId}/files/${file.uid}?teamId=${descriptor.teamId}`;
    const raw = execFileSync(process.execPath, [resolve(root, 'node_modules/vercel/dist/index.js'), 'api', endpoint, '--raw'], {encoding:'utf8',maxBuffer:100*1024*1024,stdio:['ignore','pipe','pipe']});
    const result = JSON.parse(raw);
    if (typeof result.data !== 'string') throw new Error(`Missing file content: ${file.path}`);
    bytes = Buffer.from(result.data, 'base64');
  }
  if (hash(bytes, 'sha1') !== file.uid) throw new Error(`Source UID mismatch: ${file.path}`);
  contents.set(file.uid, bytes);
  if (!existsSync(destination)) { mkdirSync(dirname(destination), {recursive:true}); writeFileSync(destination, bytes, {flag:'wx'}); }
  manifest.push({...file,sha256:hash(bytes),bytes:bytes.length});
  console.log(`Verified ${file.path} (${bytes.length} bytes)`);
}
const report = {...descriptor, recoveredAt:new Date().toISOString(), files:manifest};
writeFileSync(resolve(directory, 'manifest.json'), JSON.stringify(report,null,2)+'\n', {flag:'wx'});
console.log(`Recovered and verified ${manifest.length} source files; production unchanged.`);
