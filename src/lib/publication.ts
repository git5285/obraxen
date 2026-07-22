import type { MetadataRoute } from "next";
import type { Brand, Project } from "./schemas";

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
    }
  | {
      mode: "public";
      isPublic: true;
      robots: "index,follow";
      issues: readonly [];
    };

export class PublicationConfigurationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`La publicación está incompleta:\n- ${issues.join("\n- ")}`);
    this.name = "PublicationConfigurationError";
    this.issues = issues;
  }
}

const requiredProjectScopes = ["nombre_cliente", "fotografias_web"] as const;
const publicationLocales = ["en", "de", "es", "fr"] as const;

export function getProjectPublicationIssues(projects: readonly Project[]): string[] {
  return projects.flatMap((project) => {
    const authorization = project.autorizacionPublicacion;
    const issues: string[] = [];
    const documents = authorization.evidencias.filter(
      (evidence) => evidence.tipo === "documento_referenciado",
    );
    const publicationDocument = documents.find((evidence) =>
      requiredProjectScopes.every((scope) => evidence.alcance.includes(scope)),
    );
    const approvedReview = publicationDocument
      ? authorization.evidencias.find((evidence) =>
          evidence.tipo === "revision_legal_verificada"
          && evidence.documentoRevisado === publicationDocument.referenciaDocumento
          && evidence.resultado === "aprobada")
      : undefined;

    if (!publicationDocument) {
      issues.push(`${project.slug}: falta un documento de autorización que cubra nombre y fotografías`);
    }
    if (!approvedReview) {
      issues.push(`${project.slug}: falta una revisión legal verificada del documento de autorización`);
    }

    return issues;
  });
}

export function getPublicationIssues(
  brand: Brand,
  projects: readonly Project[],
): string[] {
  const issues = requiredPublicTextFields.flatMap((field) =>
    brand[field] ? [] : [`brand.${field} es obligatorio para publicar`],
  );

  if (!brand.nombreRevisionAprobada) {
    issues.push("el nombre comercial necesita revisión registral y marcaria aprobada antes de publicar");
  }
  if (!brand.empresaConstituida) {
    issues.push("la sociedad debe estar constituida antes de publicar");
  }
  if (!brand.telefono && !brand.whatsapp) {
    issues.push("hace falta teléfono o WhatsApp para publicar");
  }
  if (!brand.legalRevisionAprobada) {
    issues.push("la revisión legal debe estar aprobada antes de publicar");
  }
  if (!brand.formularioRevisionAprobada) {
    issues.push("el proveedor de captación y su tratamiento deben estar aprobados antes de publicar");
  }
  for (const locale of publicationLocales) {
    if (brand.revisionTraducciones[locale].estado !== "aprobada") {
      issues.push(`la traducción ${locale} necesita revisión profesional aprobada`);
    }
  }

  issues.push(...getProjectPublicationIssues(projects));

  return issues;
}

export function getPublicationState(
  brand: Brand,
  projects: readonly Project[],
): PublicationState {
  const issues = getPublicationIssues(brand, projects);

  if (!brand.publicar) {
    return {
      mode: "preview",
      isPublic: false,
      robots: "noindex,nofollow",
      issues,
    };
  }

  if (issues.length) throw new PublicationConfigurationError(issues);

  return {
    mode: "public",
    isPublic: true,
    robots: "index,follow",
    issues: [],
  };
}

export function buildRobotsPolicy(
  brand: Brand,
  projects: readonly Project[],
): MetadataRoute.Robots {
  const publication = getPublicationState(brand, projects);

  if (!publication.isPublic) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `https://${brand.dominio}/sitemap.xml`,
  };
}
