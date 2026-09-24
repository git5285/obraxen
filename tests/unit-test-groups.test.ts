import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { readGroups, validateGroups, type TestGroups } from '../scripts/unit-test-group.mjs';

const fixture = (): TestGroups => ({ home: ['tests/home.test.ts'], tooling: [], publication: [] });
describe('explicit unit test ownership', () => {
  it('assigns every repository unit suite exactly once', () => {
    const groups = readGroups(process.cwd());
    expect(groups.home).toContain('tests/public-home.test.ts');
    expect(groups.tooling).toContain('tests/agents/policy.test.ts');
    expect(groups.publication).toContain('tests/activation-policy.test.ts');
    expect(groups.tooling).toContain('tests/vercel-bundles.test.ts');
  });
  it('rejects a new suite without ownership, stale paths and duplicate assignments', () => {
    expect(() => validateGroups(fixture(), ['tests/home.test.ts', 'tests/new.test.ts'])).toThrow();
    expect(() => validateGroups(fixture(), [])).toThrow();
    const duplicate = fixture(); duplicate.tooling.push('tests/home.test.ts');
    expect(() => validateGroups(duplicate, ['tests/home.test.ts'])).toThrow('more than one group');
  });
  it('rejects unsafe file selectors', () => {
    const unsafe = fixture(); unsafe.home = ['../secret.test.ts'];
    expect(() => validateGroups(unsafe, unsafe.home)).toThrow('invalid test path');
  });
  it('lists each group without invoking a test runner', () => {
    const groups = readGroups(process.cwd());
    for (const group of Object.keys(groups)) {
      const result = spawnSync(process.execPath, ['scripts/unit-test-group.mjs', group, '--list'], { encoding: 'utf8' });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).files).toEqual(groups[group as keyof TestGroups]);
    }
  });
  it('preserves all-suite coverage in the full gate and dedicated commands', () => {
    const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(scripts['test:coverage']).toContain('vitest run --coverage');
    for (const group of ['home', 'tooling', 'publication']) {
      expect(scripts[`test:${group}`]).toContain(`scripts/unit-test-group.mjs ${group}`);
    }
  });
  it('keeps extracted contracts and test selection protected from autonomous edits', () => {
    const policy = JSON.parse(readFileSync('automation/agents/policy.json', 'utf8'));
    expect(policy.protectedPaths).toEqual(expect.arrayContaining([
      'domain/publication/**', 'scripts/unit-test-group*', 'tests/unit-test-groups*',
      'scripts/scoped-command*', 'tests/scoped-command.test.ts',
    ]));
    expect(policy.authority.allowDeploy).toBe(false);
    expect(policy.authority.allowPublish).toBe(false);
  });
});
