import { describe, expect, it } from "vitest";
import { publicProjectImages, type PublicProjectImageMap } from "@/lib/public-project-assets";
import { hasPublicProjectAuthorization, isPublicProject } from "@/lib/public-project-publication";
import { projects, publicProjects } from "@/lib/projects";
import type { Project } from "@/lib/schemas";

describe("public project selector", () => {
  it("keeps every case private until its dossier and assets are approved", () => {
    expect(publicProjects).toEqual([]);
  });

  it("requires both linked legal evidence and every approved asset", () => {
    const project = projects[0];
    const authorizedProject: Project = {
      ...project,
      autorizacionPublicacion: {
        evidencias: [
          {
            tipo: "documento_referenciado",
            alcance: ["nombre_cliente", "fotografias_web"],
            entidadAutorizante: "Cliente autorizado",
            emitidoEl: "2026-09-01",
            referenciaDocumento: "AUTH-001",
          },
          {
            tipo: "revision_legal_verificada",
            documentoRevisado: "AUTH-001",
            revisor: "Legal reviewer",
            revisadoEl: "2026-09-01",
            referenciaRevision: "LEGAL-001",
            resultado: "aprobada",
          },
        ],
      },
    };
    const images = Object.fromEntries(project.imagenes.map(({ src }) => [src, {
      src: `/${src}`,
      width: 1200,
      height: 800,
    }])) as PublicProjectImageMap;

    expect(hasPublicProjectAuthorization(project)).toBe(false);
    expect(hasPublicProjectAuthorization(authorizedProject)).toBe(true);
    expect(isPublicProject(authorizedProject, images)).toBe(true);
    expect(isPublicProject(authorizedProject, publicProjectImages)).toBe(false);
  });
});
