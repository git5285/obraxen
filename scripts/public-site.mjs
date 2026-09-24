import { spawn, spawnSync } from 'node:child_process';
import { watchFile, unwatchFile } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assertHomeContract } from './home-contract.mjs';

const app = fileURLToPath(new URL('../apps/public-site/', import.meta.url));
const next = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const [command, ...options] = process.argv.slice(2);
if (!['dev', 'build', 'start'].includes(command)) {
  throw new Error('Use public-site.mjs dev|build|start');
}
function generate() {
  assertHomeContract(app);
  const result = spawnSync(process.execPath, ['generate-route-content.mjs'], { cwd: app, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (command !== 'start') generate();
const html = fileURLToPath(new URL('../apps/public-site/public/index.html', import.meta.url));
if (command === 'dev') watchFile(html, { interval: 300 }, (current, previous) => {
  if (current.mtimeMs !== previous.mtimeMs && current.size > 0) generate();
});
if (command !== 'build') {
  if (!options.some(value => value === '--port' || value === '-p' || value.startsWith('--port='))) options.push('--port', '4387');
  if (!options.some(value => value === '--hostname' || value === '-H' || value.startsWith('--hostname='))) options.push('--hostname', '127.0.0.1');
}
const child = spawn(process.execPath, [next, command, ...options], { cwd: app, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { unwatchFile(html); console.error(error); process.exitCode = 1; });
child.on('exit', (code, signal) => {
  unwatchFile(html);
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
