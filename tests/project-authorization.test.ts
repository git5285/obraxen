import { describe, expect, it } from 'vitest';
import { internalProjects } from '../domain/publication/internal-projects';
import { hasProjectPublicationAuthorization } from '../domain/publication/project-publication-authorization';
import { projectSchema } from '../domain/publication/schemas';

describe('internal project publication evidence without a web application', () => {
  it.each(['denegada', 'cambios_requeridos'] as const)('does not keep an earlier approval after a later %s review', resultado => {
    const project = structuredClone(internalProjects[0]);
    const approved = {tipo: 'revision_legal_verificada' as const, documentoRevisado: 'DOC-1',
      revisor: 'Fixture', revisadoEl: '2026-09-02', referenciaRevision: 'REVIEW-1', resultado: 'aprobada' as const};
    project.autorizacionPublicacion.evidencias = [
      {tipo: 'documento_referenciado', alcance: ['nombre_cliente', 'fotografias_web'],
        entidadAutorizante: 'Fixture', emitidoEl: '2026-09-01', referenciaDocumento: 'DOC-1'},
      approved,
      {...approved, revisadoEl: '2026-09-03', referenciaRevision: 'REVIEW-2', resultado},
    ];
    expect(hasProjectPublicationAuthorization(projectSchema.parse(project))).toBe(false);
    project.autorizacionPublicacion.evidencias.reverse();
    expect(hasProjectPublicationAuthorization(projectSchema.parse(project))).toBe(false);
  });
  it.each([
    {name: 'same-day denial', reviews: [['2026-09-02', 'aprobada'], ['2026-09-02', 'denegada']], expected: false},
    {name: 'same-day requested changes', reviews: [['2026-09-02', 'cambios_requeridos'], ['2026-09-02', 'aprobada']], expected: false},
    {name: 'later reapproval', reviews: [['2026-09-02', 'denegada'], ['2026-09-03', 'aprobada']], expected: true},
    {name: 'same-day consistent approval', reviews: [['2026-09-02', 'aprobada'], ['2026-09-02', 'aprobada']], expected: true},
  ])('uses current evidence independent of input order: $name', ({reviews, expected}) => {
    const project = projectSchema.parse({...internalProjects[0], autorizacionPublicacion: {evidencias: [
      {tipo: 'documento_referenciado', alcance: ['nombre_cliente', 'fotografias_web'],
        entidadAutorizante: 'Fixture', emitidoEl: '2026-09-01', referenciaDocumento: 'DOC-1'},
      ...reviews.map(([revisadoEl, resultado], index) => ({tipo: 'revision_legal_verificada', documentoRevisado: 'DOC-1',
        revisor: 'Fixture', revisadoEl, referenciaRevision: 'REVIEW-' + index, resultado})),
    ]}});
    expect(hasProjectPublicationAuthorization(project)).toBe(expected);
    project.autorizacionPublicacion.evidencias.reverse();
    expect(hasProjectPublicationAuthorization(project)).toBe(expected);
  });
  it('does not use a later review of an unrelated document to supersede this document', () => {
    const project = projectSchema.parse({...internalProjects[0], autorizacionPublicacion: {evidencias: [
      ...['DOC-1', 'DOC-2'].map(referenciaDocumento => ({tipo: 'documento_referenciado',
        alcance: ['nombre_cliente', 'fotografias_web'], entidadAutorizante: 'Fixture', emitidoEl: '2026-09-01', referenciaDocumento})),
      {tipo: 'revision_legal_verificada', documentoRevisado: 'DOC-1', revisor: 'Fixture',
        revisadoEl: '2026-09-02', referenciaRevision: 'REVIEW-1', resultado: 'denegada'},
      {tipo: 'revision_legal_verificada', documentoRevisado: 'DOC-2', revisor: 'Fixture',
        revisadoEl: '2026-09-03', referenciaRevision: 'REVIEW-2', resultado: 'aprobada'},
    ]}});
    expect(hasProjectPublicationAuthorization(project)).toBe(true);
    const document = project.autorizacionPublicacion.evidencias[1];
    if (document.tipo !== 'documento_referenciado') throw new Error('invalid fixture');
    document.alcance = ['nombre_cliente'];
    expect(hasProjectPublicationAuthorization(project)).toBe(false);
  });
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
