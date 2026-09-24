import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { ALIASES, runAlias } from '../scripts/scoped-command.mjs';
it('resolves every compatible alias to an explicit application and forwards arguments without a shell', () => {
  const {scripts} = JSON.parse(readFileSync('package.json', 'utf8'));
  for(const [alias,target] of Object.entries(ALIASES)) {
    const run = vi.fn(() => ({status:0})); const log = vi.fn();
    expect(runAlias(alias, ['--port','4399'],run,log)).toBe(0);
    expect(scripts[alias]).toContain(`scripts/scoped-command.mjs ${alias}`);
    expect(scripts[target]).toBeTruthy();
    expect(scripts[target]).not.toContain('scoped-command.mjs');
    expect(run).toHaveBeenCalledWith('npm',['run',target,'--','--port','4399'],expect.objectContaining({shell:false}));
    expect(log.mock.calls[0][0]).toContain('apps/public-site/');
  }
});
it('preserves nonzero status and rejects unknown aliases', () => {
  expect(runAlias('build',[],()=>({status:7}),()=>{})).toBe(7);
  expect(runAlias('build',[],()=>({status:null}),()=>{})).toBe(1);
  expect(()=>runAlias('missing')).toThrow('Unknown');
  expect(()=>runAlias('build',[],()=>({error:new Error('spawn failed')}),()=>{})).toThrow('spawn failed');
});
