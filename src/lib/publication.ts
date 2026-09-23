import type { MetadataRoute } from "next";
import type { Brand, Project } from "./schemas";
// @ts-expect-error The activation CLI requires explicit TypeScript extensions.
import { locales as publicationLocales } from "./locales.ts";
// @ts-expect-error The activation CLI also imports this module with Node type stripping.
import { getProjectPublicationDocuments, hasProjectPublicationAuthorization, requiredProjectPublicationScopes } from "./project-publication-authorization.ts";

export { hasProjectPublicationAuthorization, requiredProjectPublicationScopes };

const requiredPublicTextFields = [
  "nombre",
  "nombreLegal",
  "cif",
  "direccion",
  "dominio",
  "email",
  "emailPrivacidad",
  "formularioProveedor",
] as const;

export type PublicationState =
  | {
      mode: "preview";
      isPublic: false;
      robots: "noindex,nofollow";
      issues: readonly string[];
      warnings: readonly string[];
    }
  | {
      mode: "public";
      isPublic: true;
      robots: "index,follow";
      issues: readonly [];
      warnings: readonly string[];
    };

export class PublicationConfigurationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`La publicación está incompleta:\n- ${issues.join("\n- ")}`);
    this.name = "PublicationConfigurationError";
    this.issues = issues;
  }
}

export function getProjectPublicationIssues(projects: readonly Project[]): string[] {
  return projects.flatMap((project) => {
    const issues: string[] = [];
    const publicationDocuments = getProjectPublicationDocuments(project);

    if (publicationDocuments.length === 0) {
      issues.push(`${project.slug}: falta un documento de autorización que cubra nombre y fotografías`);
    }
    if (!hasProjectPublicationAuthorization(project)) {
      issues.push(`${project.slug}: falta una revisión legal verificada del documento de autorización`);
    }

    return issues;
  });
}

export function getPublicationIssues(
  brand: Brand,
  projects: readonly Project[],
): string[] {
  // This is the global activation gate. Individual cases are selected for
  // publication by publicProjects, which applies authorization and asset gates.
  void projects; // Project evidence is reported separately as advisory warnings.
  const issues: string[] = [];

  if (!brand.legalRevisionAprobada) {
    issues.push("la revisión legal debe estar aprobada antes de publicar");
  }
  if (brand.formularioProveedor !== "Resend" || !brand.formularioRevisionAprobada) {
    issues.push("el proveedor de captación y su tratamiento deben estar aprobados antes de publicar");
  }
  for (const locale of publicationLocales) {
    if (brand.revisionTraducciones[locale].estado !== "aprobada") {
      issues.push(`la traducción ${locale} necesita revisión profesional aprobada`);
    }
  }

  return issues;
}

export function getPublicationWarnings(
  brand: Brand,
  projects: readonly Project[],
): string[] {
  const warnings = requiredPublicTextFields.flatMap((field) =>
    brand[field] ? [] : [`brand.${field} no está informado`],
  );

  if (!brand.nombreRevisionAprobada) {
    warnings.push("el nombre comercial no tiene revisión registral y marcaria acreditada");
  }
  if (!brand.empresaConstituida) {
    warnings.push("la constitución de la sociedad no está acreditada");
  }
  if (!brand.telefono && !brand.whatsapp) {
    warnings.push("no hay teléfono o WhatsApp informado");
  }

  warnings.push(...getProjectPublicationIssues(projects));

  return warnings;
}

export function getPublicationState(
  brand: Brand,
  projects: readonly Project[],
): PublicationState {
  const issues = getPublicationIssues(brand, projects);
  const warnings = getPublicationWarnings(brand, projects);

  if (!brand.publicar) {
    return {
      mode: "preview",
      isPublic: false,
      robots: "noindex,nofollow",
      issues,
      warnings,
    };
  }

  if (issues.length) throw new PublicationConfigurationError(issues);

  return {
    mode: "public",
    isPublic: true,
    robots: "index,follow",
    issues: [],
    warnings,
  };
}

export function getPublicPublicationState(
  brand: Brand,
  approval: { readonly approved: boolean },
): PublicationState {
  const state = getPublicationState(brand, []);
  if (!state.isPublic || approval.approved) return state;
  return {
    mode: "preview",
    isPublic: false,
    robots: "noindex,nofollow",
    issues: [...state.issues, "la activacion publica requiere una decision externa verificada"],
    warnings: state.warnings,
  };
}

export function buildRobotsPolicy(
  brand: Brand,
  projects: readonly Project[],
): MetadataRoute.Robots {
  return robotsPolicy(brand, getPublicationState(brand, projects));
}

export function buildPublicRobotsPolicy(
  brand: Brand,
  approval: { readonly approved: boolean },
): MetadataRoute.Robots {
  return robotsPolicy(brand, getPublicPublicationState(brand, approval));
}

function robotsPolicy(brand: Brand, publication: PublicationState): MetadataRoute.Robots {
  return publication.isPublic
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `https://${brand.dominio}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
