import { execFileSync } from 'node:child_process';
import { afterEach, expect, it, vi } from 'vitest';
import { checkoutContext } from '../scripts/checkout-context.mjs';
vi.mock('node:child_process', () => ({execFileSync: vi.fn()}));
afterEach(() => vi.resetAllMocks());
function fixture(status = '') {
  vi.mocked(execFileSync).mockImplementation(((_command: string, args: string[]) => {
    if (args.includes('--show-toplevel')) return process.cwd();
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
it('fails closed on the wrong SHA or a dirty candidate when requested', () => {
  fixture(' M package.json');
  expect(() => checkoutContext(process.cwd(), {expectedHead: 'b'.repeat(40)})).toThrow('Unexpected checkout HEAD');
  expect(() => checkoutContext(process.cwd(), {requireClean: true})).toThrow('pending changes');
  fixture();
  expect(checkoutContext(process.cwd(), {expectedHead: 'a'.repeat(40), requireClean: true}).dirty).toBe(false);
});
