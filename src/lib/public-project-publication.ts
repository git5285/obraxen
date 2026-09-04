import type { PublicProjectImageMap } from "./public-project-assets";
import { hasPublicProjectAssets } from "./public-project-assets";
import type { Project } from "./schemas";

const requiredPublicationScopes = ["nombre_cliente", "fotografias_web"] as const;

export function hasPublicProjectAuthorization(project: Project): boolean {
  const documents = project.autorizacionPublicacion.evidencias.filter(
    (evidence) => evidence.tipo === "documento_referenciado",
  ).filter((document) => requiredPublicationScopes.every(
    (scope) => document.alcance.includes(scope),
  ));

  return documents.some((document) => project.autorizacionPublicacion.evidencias.some(
    (evidence) => evidence.tipo === "revision_legal_verificada"
      && evidence.documentoRevisado === document.referenciaDocumento
      && evidence.resultado === "aprobada",
  ));
}

export function isPublicProject(project: Project, imageMap: PublicProjectImageMap): boolean {
  return hasPublicProjectAuthorization(project) && hasPublicProjectAssets(project, imageMap);
}
