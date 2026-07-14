import type { MetadataRoute } from "next";
import type { Brand } from "./schemas";

const requiredPublicTextFields = [
  "nombre",
  "nombreLegal",
  "cif",
  "direccion",
  "dominio",
  "email",
  "legalUrl",
  "privacidadUrl",
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
  constructor(readonly issues: readonly string[]) {
    super(`La publicación está incompleta:\n- ${issues.join("\n- ")}`);
    this.name = "PublicationConfigurationError";
  }
}

export function getPublicationIssues(brand: Brand): string[] {
  const issues = requiredPublicTextFields.flatMap((field) =>
    brand[field] ? [] : [`brand.${field} es obligatorio para publicar`],
  );

  if (!brand.empresaConstituida) {
    issues.push("la sociedad debe estar constituida antes de publicar");
  }
  if (!brand.telefono && !brand.whatsapp) {
    issues.push("hace falta teléfono o WhatsApp para publicar");
  }
  if (!brand.legalRevisionAprobada) {
    issues.push("la revisión legal debe estar aprobada antes de publicar");
  }

  for (const field of ["legalUrl", "privacidadUrl"] as const) {
    const value = brand[field];
    if (value && !/^(?:https:\/\/|\/(?!\/))/.test(value)) {
      issues.push(`brand.${field} debe ser una URL https o una ruta absoluta`);
    }
  }

  return issues;
}

export function getPublicationState(brand: Brand): PublicationState {
  const issues = getPublicationIssues(brand);

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

export function buildRobotsPolicy(brand: Brand): MetadataRoute.Robots {
  const publication = getPublicationState(brand);

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
