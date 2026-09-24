import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { candidateInputs } from '../scripts/prepare-home-candidate.mjs';
import { FRESH_CHECKS, LOCAL_CHECKS } from '../scripts/quality-gate.mjs';
import { publicDataLeaks } from './helpers/public-module-boundary';

describe('retired application boundary', () => {
  it('removes every authorized file, while preserving internal evidence', () => {
    const inventory = JSON.parse(readFileSync('docs/legacy-retirement-files.json', 'utf8'));
    expect(inventory.deleteAfterApproval).toHaveLength(144);
    for (const file of inventory.deleteAfterApproval) expect(existsSync(file.path), file.path).toBe(false);
    for (const path of ['data/brand.json', 'data/proyectos.json', 'data/ofertas.json', 'domain/publication/schemas.ts']) {
      expect(existsSync(path), path).toBe(true);
    }
  });
  it('keeps private data and the retired application out of Home candidate inputs', () => {
    const inputs = candidateInputs(process.cwd());
    expect(inputs.some(file => file.path.startsWith('apps/public-site/public/'))).toBe(true);
    expect(inputs.filter(file => /^(src|data|domain)\//.test(file.path))).toEqual([]);
  });
  it('preserves the transitive private-data leak detector', () => {
    const root = '/boundary-fixture';
    const files: Record<string, string> = {
      [root + '/app/route.ts']: 'export { records } from "../domain/bridge";',
      [root + '/domain/bridge.ts']: 'export { default as records } from "../data/proyectos.json";',
      [root + '/data/proyectos.json']: '[]',
    };
    expect(publicDataLeaks(['app/route.ts'], root, {
      exists: path => Object.hasOwn(files, path), read: path => files[path],
    })).toEqual([[root + '/app/route.ts', root + '/domain/bridge.ts', root + '/data/proyectos.json']]);
  });
  it('does not retain commands, imports or a type alias into the retired app', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(Object.keys(manifest.scripts).filter(name => /legacy|lighthouse|^test:e2e$|^test:e2e:contact$/.test(name))).toEqual([]);
    expect(manifest.devDependencies.lighthouse).toBeUndefined();
    expect(manifest.devDependencies['@axe-core/playwright']).toBeUndefined();
    const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
    expect(tsconfig.compilerOptions.paths).toBeUndefined();
    for (const directory of ['scripts', 'domain', 'automation', 'tests']) {
      for (const path of readdirSync(directory, { recursive: true, encoding: 'utf8' }).filter(path => /\.(?:mjs|ts|tsx)$/.test(path))) {
        const source = readFileSync(directory + '/' + path, 'utf8');
        // Inspect import/export declarations, not historical path strings in agent fixtures.
        expect(source, directory + '/' + path).not.toMatch(/^\s*(?:import|export)\b[^;]*?from\s*['"](?:@\/|[^'"]*\/src\/)/m);
      }
    }
  });
  it('retains all current consumers and security checks in local and CI gates', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
    const workflow = readFileSync('.github/workflows/quality.yml', 'utf8');
    expect(LOCAL_CHECKS).toEqual(['lint', 'typecheck', 'test:coverage', 'build']);
    expect(FRESH_CHECKS).toEqual(['test:published']);
    for (const check of [...LOCAL_CHECKS, ...FRESH_CHECKS, 'check:security']) {
      expect(manifest.scripts[check]).toBeTruthy();
      expect(workflow).toContain('npm run ' + check);
    }
    expect(workflow).not.toMatch(/npm run (?:\S*legacy|test:e2e|lighthouse)/);
    expect(manifest.scripts['check:quality']).toContain('npm run check:security');
  });
});
