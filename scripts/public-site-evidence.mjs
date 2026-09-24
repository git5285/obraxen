import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

// Only ordinary files below an explicit root: no path traversal or symlink inputs.
export function sourceFile(root, path) {
  assert(typeof path === 'string' && path && path !== '.' && !path.includes('\\')
    && !posix.isAbsolute(path) && posix.normalize(path) === path && !path.startsWith('../'), 'unsafe source path');
  let absolute = resolve(root);
  assert(!lstatSync(absolute).isSymbolicLink(), 'symbolic source root');
  for (const segment of path.split('/')) {
    absolute = join(absolute, segment);
    assert(!lstatSync(absolute).isSymbolicLink(), `symbolic source: ${path}`);
  }
  assert(lstatSync(absolute).isFile(), `not a source file: ${path}`);
  return absolute;
}

export function inventory(root) {
  const files = [];
  function visit(directory, prefix = '') {
    assert(!lstatSync(directory).isSymbolicLink(), 'symbolic inventory root');
    for (const name of readdirSync(directory).sort()) {
      const path = prefix + name;
      const stat = lstatSync(join(directory, name));
      assert(!stat.isSymbolicLink(), `symbolic source: ${path}`);
      if (stat.isDirectory()) visit(join(directory, name), path + '/');
      else {
        const bytes = readFileSync(sourceFile(root, path));
        assert(!bytes.subarray(0, 80).toString().startsWith('version https://git-lfs.github.com/spec/v1'),
          `unresolved LFS pointer: ${path}`);
        files.push({ path, bytes: bytes.length, sha256: sha256(bytes) });
      }
    }
  }
  visit(resolve(root));
  return files;
}

export function assertInventory(expected, actual) {
  assert.deepEqual(actual, expected, 'candidate inventory differs');
}

// Historical recovery integrity is independent of the maintained candidate.
export function verifyRecovery(root, provenance) {
  assert(Array.isArray(provenance.files) && provenance.files.length > 0, 'empty recovery inventory');
  const seen = new Set();
  for (const entry of provenance.files) {
    assert(!seen.has(entry.path), 'duplicate recovery path');
    seen.add(entry.path);
    const bytes = readFileSync(sourceFile(root, entry.path));
    assert.equal(bytes.length, entry.bytes, `recovery size: ${entry.path}`);
    assert.equal(sha256(bytes), entry.sha256, `recovery SHA-256: ${entry.path}`);
    if (entry.uid) assert.equal(createHash('sha1').update(bytes).digest('hex'), entry.uid, `recovery UID: ${entry.path}`);
  }
  return { kind: 'historical-recovery', recoverySourceDeploymentId: provenance.deploymentId,
    filesVerified: seen.size, result: 'passed' };
}

// The caller chooses a destination explicitly. No original hash participates here.
export async function verifyServedInventory(origin, files, request = fetch) {
  const result = [];
  for (const file of files) {
    const path = '/' + file.path.split('/').map(encodeURIComponent).join('/');
    const response = await request(new URL(path, origin), { redirect: 'error' });
    assert.equal(response.status, 200, `asset status: ${path}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha256(bytes), file.sha256, `candidate asset differs: ${path}`);
    result.push({ path, sha256: file.sha256, bytes: bytes.length });
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert(args.length === 1 && args[0].startsWith('--recovery-root='), 'Use --recovery-root=<original local directory>');
  const provenance = JSON.parse(readFileSync(new URL('../docs/published-site-source.json', import.meta.url), 'utf8'));
  console.log(JSON.stringify(verifyRecovery(resolve(args[0].slice(16)), provenance), null, 2));
}
