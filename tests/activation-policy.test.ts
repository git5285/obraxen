import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { getActivationIssues, locales, type ActivationBrand } from '../domain/publication/activation.mjs';

const approved = (): ActivationBrand => ({
  legalRevisionAprobada: true, formularioProveedor: 'Resend', formularioRevisionAprobada: true,
  revisionTraducciones: { en: { estado: 'aprobada' }, de: { estado: 'aprobada' }, es: { estado: 'aprobada' }, fr: { estado: 'aprobada' } },
});
describe('application-independent activation policy', () => {
  it('keeps all six existing blockers and their order for current internal data', () => {
    expect(getActivationIssues(JSON.parse(readFileSync('data/brand.json', 'utf8')))).toEqual([
      'la revisión legal debe estar aprobada antes de publicar',
      'el proveedor de captación y su tratamiento deben estar aprobados antes de publicar',
      ...locales.map(locale => `la traducción ${locale} necesita revisión profesional aprobada`),
    ]);
  });
  it('allows complete evidence without changing publication authority or input data', () => {
    const brand = approved(); const before = JSON.stringify(brand);
    expect(getActivationIssues(brand)).toEqual([]);
    expect(JSON.stringify(brand)).toBe(before);
  });
  it.each(locales)('requires the %s professional review', locale => {
    const brand = approved(); brand.revisionTraducciones[locale].estado = 'pendiente';
    expect(getActivationIssues(brand)).toEqual([`la traducción ${locale} necesita revisión profesional aprobada`]);
  });
  it('requires legal and provider approval independently', () => {
    expect(getActivationIssues({ ...approved(), legalRevisionAprobada: false })).toHaveLength(1);
    expect(getActivationIssues({ ...approved(), formularioProveedor: null })).toHaveLength(1);
    expect(getActivationIssues({ ...approved(), formularioRevisionAprobada: false })).toHaveLength(1);
  });
  it('fails closed on missing review data', () => {
    expect(() => getActivationIssues({ ...approved(), revisionTraducciones: {} } as ActivationBrand)).toThrow();
  });
  it('runs the CLI without TypeScript stripping or imports from the legacy application', () => {
    const cli = readFileSync('scripts/check-activation.mjs', 'utf8');
    expect(cli).not.toContain('../src/');
    expect(cli).not.toContain('proyectos.json');
    const result = spawnSync(process.execPath, ['scripts/check-activation.mjs', '--json'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toMatchObject({
      decision: 'NO-GO', blockerCount: 6, candidateAuditRequired: true, publicationAuthorized: false, publishSwitch: false,
    });
  });
});
