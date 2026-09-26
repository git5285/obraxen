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
  return getProjectPublicationDocuments(project).some((document) => {
    const reviews = project.autorizacionPublicacion.evidencias.filter(
      (evidence) => evidence.tipo === "revision_legal_verificada",
    ).filter((review) => review.documentoRevisado === document.referenciaDocumento);
    const latestDate = reviews.reduce(
      (latest, review) => review.revisadoEl > latest ? review.revisadoEl : latest,
      "",
    );
    const latestReviews = reviews.filter((review) => review.revisadoEl === latestDate);
    // Schema-validated dates have day precision: same-day conflicts fail closed.
    return latestReviews.length > 0
      && latestReviews.every((review) => review.resultado === "aprobada");
  });
}
