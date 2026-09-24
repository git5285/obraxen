import { describe, expect, it } from 'vitest';
import { internalProjects } from '../domain/publication/internal-projects';
import { hasProjectPublicationAuthorization } from '../domain/publication/project-publication-authorization';

describe('internal project publication evidence without a web application', () => {
  it('does not treat current responsible declarations as verified authorization', () => {
    expect(internalProjects.length).toBeGreaterThan(0);
    expect(internalProjects.every(project => !hasProjectPublicationAuthorization(project))).toBe(true);
  });
  it('requires linked approval and both scopes', () => {
    const project = structuredClone(internalProjects[0]);
    project.autorizacionPublicacion.evidencias = [{
      tipo: 'documento_referenciado', alcance: ['nombre_cliente', 'fotografias_web'],
      entidadAutorizante: 'Fixture', emitidoEl: '2026-09-01', referenciaDocumento: 'DOC-1',
    }];
    expect(hasProjectPublicationAuthorization(project)).toBe(false);
    project.autorizacionPublicacion.evidencias.push({
      tipo: 'revision_legal_verificada', documentoRevisado: 'DOC-1', revisor: 'Fixture',
      revisadoEl: '2026-09-02', referenciaRevision: 'REVIEW-1', resultado: 'aprobada',
    });
    expect(hasProjectPublicationAuthorization(project)).toBe(true);
    const review = project.autorizacionPublicacion.evidencias[1];
    if (review.tipo !== 'revision_legal_verificada') throw new Error('invalid fixture');
    review.resultado = 'denegada';
    expect(hasProjectPublicationAuthorization(project)).toBe(false);
    review.resultado = 'aprobada'; review.documentoRevisado = 'OTHER-DOC';
    expect(hasProjectPublicationAuthorization(project)).toBe(false);
    review.documentoRevisado = 'DOC-1';
    const document = project.autorizacionPublicacion.evidencias[0];
    if (document.tipo !== 'documento_referenciado') throw new Error('invalid fixture');
    document.alcance = ['nombre_cliente'];
    expect(hasProjectPublicationAuthorization(project)).toBe(false);
  });
});
