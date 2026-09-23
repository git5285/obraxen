import type { Project } from "./schemas";

export const requiredProjectPublicationScopes = ["nombre_cliente", "fotografias_web"] as const;

export function getProjectPublicationDocuments(project: Project) {
  return project.autorizacionPublicacion.evidencias.filter(
    (evidence) => evidence.tipo === "documento_referenciado",
  ).filter((document) => requiredProjectPublicationScopes.every(
    (scope) => document.alcance.includes(scope),
  ));
}

export function hasProjectPublicationAuthorization(project: Project): boolean {
  return getProjectPublicationDocuments(project).some((document) =>
    project.autorizacionPublicacion.evidencias.some(
      (evidence) => evidence.tipo === "revision_legal_verificada"
        && evidence.documentoRevisado === document.referenciaDocumento
        && evidence.resultado === "aprobada",
    ),
  );
}
