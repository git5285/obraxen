import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { checkoutContext } from '../scripts/checkout-context.mjs';
vi.mock('node:child_process', () => ({execFileSync: vi.fn()}));
vi.mock('node:fs', async importOriginal => ({...await importOriginal<typeof import('node:fs')>(), existsSync: vi.fn()}));
afterEach(() => vi.resetAllMocks());
function fixture(status = '', controlRoot = process.cwd()) {
  vi.mocked(execFileSync).mockImplementation(((_command: string, args: string[]) => {
    if (args.includes('--show-toplevel')) return process.cwd();
    if (args.includes('--git-common-dir')) return join(controlRoot, '.git');
    if (args.includes('HEAD')) return 'a'.repeat(40);
    if (args.includes('status')) return status;
    return '';
  }) as typeof execFileSync);
}
it('reports the actual root, detached HEAD and dirty state without querying remotes', () => {
  fixture(' M package.json');
  expect(checkoutContext(process.cwd())).toMatchObject({head: 'a'.repeat(40), branch: null, dirty: true, status: [' M package.json'], remoteState: 'not-queried'});
  expect(vi.mocked(execFileSync).mock.calls.every(([cmd, args]) => cmd === 'git' && !(args as string[]).includes('fetch'))).toBe(true);
});
it('identifies the control and a separate worktree without selecting a candidate implicitly', () => {
  fixture();
  expect(checkoutContext(process.cwd())).toMatchObject({controlRoot: process.cwd(), checkoutRole: 'control', automation: 'automation/agents/'});
  fixture('', dirname(process.cwd()));
  expect(checkoutContext(process.cwd())).toMatchObject({controlRoot: dirname(process.cwd()), checkoutRole: 'worktree'});
  expect(() => checkoutContext(process.cwd(), {expectedRoot: dirname(process.cwd())})).toThrow('Unexpected checkout root');
  expect(checkoutContext(process.cwd(), {expectedRoot: process.cwd()}).root).toBe(process.cwd());
});
it('fails closed on the wrong SHA or a dirty candidate when requested', () => {
  fixture(' M package.json');
  expect(() => checkoutContext(process.cwd(), {expectedHead: 'b'.repeat(40)})).toThrow('Unexpected checkout HEAD');
  expect(() => checkoutContext(process.cwd(), {requireClean: true})).toThrow('pending changes');
  fixture();
  expect(checkoutContext(process.cwd(), {expectedHead: 'a'.repeat(40), requireClean: true}).dirty).toBe(false);
});

it('reports legacy only when the selected checkout contains its application', () => {
  fixture();
  vi.mocked(existsSync).mockReturnValue(false);
  expect(checkoutContext(process.cwd()).legacy).toBeNull();
  vi.mocked(existsSync).mockImplementation(path => String(path).endsWith('/src/app/[lang]/layout.tsx'));
  expect(checkoutContext(process.cwd()).legacy).toBe('src/');
});
