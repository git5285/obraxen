import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import PrecisionPreview, { metadata } from "@/app/[lang]/architecture-preview/precision/page";
import { ArchitecturePrecision, type PrecisionProject } from "@/components/architecture-precision";
import { publicProjects } from "@/lib/projects";

afterEach(() => vi.unstubAllEnvs());
const project: PrecisionProject = {
  name: "Caso <documentado>", city: "Ciudad", country: "País", sector: "Industria", area: null,
  description: "Intervención comprobada", problem: "Daño localizado", result: "Resultado registrado",
  duration: null, materials: [], images: [
    { src: "/example-result.webp", alt: "Fotografía de resultado", stage: "Resultado documentado", width: 1400, height: 646 },
    { src: "/example-initial.webp", alt: "Fotografía de estado inicial", stage: "Estado inicial", width: 1400, height: 646 },
  ],
};

describe("precision local alternative", () => {
  it.each([
    ["production", "local-only", "", "es"], ["development", "", "", "es"],
    ["development", "local-only", "1", "es"], ["development", "local-only", "", "en"],
    ["test", "local-only", "", "es"],
  ])("fails closed for %s/%s/%s/%s", async (mode, flag, vercel, lang) => {
    vi.stubEnv("NODE_ENV", mode); vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", flag); vi.stubEnv("VERCEL", vercel);
    await expect(PrecisionPreview({ params: Promise.resolve({ lang }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
  it("renders truthful private records only in explicitly enabled local development", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", "local-only"); vi.stubEnv("VERCEL", "");
    const html = renderToStaticMarkup(await PrecisionPreview({ params: Promise.resolve({ lang: "es" }) }));
    expect(html).toContain("Delticom"); expect(html).toContain("Hologram");
    expect(html).toContain("18.084"); expect(html).toContain("2 meses");
    expect(html).toContain("intervenciones anteriores de integrantes del equipo");
    expect(html).toContain("data:image/webp;base64,"); expect(html).not.toContain("/img/proyectos/");
    expect(html).not.toContain("architecture-hall-illustrative"); expect(html).not.toContain("style=");
    expect(publicProjects).toHaveLength(0);
    expect(metadata.robots).toEqual({ index: false, follow: false, nocache: true });
  });
  it("keeps proof ahead of services and images ahead of case explanations", () => {
    const html = renderToStaticMarkup(<ArchitecturePrecision projects={[project]} />);
    const positions = ["projects", "services", "start", "contact"].map(id => html.indexOf(`id="${id}"`));
    expect(positions.every(position => position > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    const caseHtml = html.slice(html.indexOf('class="ap-case ap-case-featured"'), html.indexOf('id="services"'));
    expect(caseHtml.indexOf("<img")).toBeLessThan(caseHtml.indexOf("Daño localizado"));
    expect(caseHtml).toContain("Sin superficie total confirmada");
    expect(caseHtml).toContain("Caso &lt;documentado&gt;");
    expect(caseHtml).toContain("Los encuadres son distintos");
  });
  it("puts each service explanation in the same native disclosure with no duplicate sheets", () => {
    const html = renderToStaticMarkup(<ArchitecturePrecision projects={[]} />);
    expect(html.match(/name="precision-services"/g)).toHaveLength(5);
    expect(html).not.toContain("ar-technical-sheets");
    expect(html).toMatch(/id="ap-service-1"[\s\S]*Qué revisar[\s\S]*Estado de los bordes/);
    expect(html).toContain("No hay proyectos disponibles en esta selección.");
    expect(html).not.toContain("Fotografías del registro documental.");
  });
  it("keeps demo collapsed, real contact first, and current preview reachable", () => {
    const html = renderToStaticMarkup(<ArchitecturePrecision projects={[]} />);
    expect(html).toContain('<details class="ap-demo">');
    expect(html.indexOf('href="mailto:info@obraxen.com"')).toBeLessThan(html.indexOf('class="ap-demo"'));
    expect(html.indexOf("No envía consultas ni guarda datos.")).toBeLessThan(html.indexOf('id="ar-name"'));
    expect(html).toMatch(/href="\/es\/architecture-preview\/?"/);
    expect(html).toContain("Teléfono y WhatsApp temporales");
    expect(html).toContain("Sin envío ni almacenamiento");
  });
  it("isolates its CSS and uses the approved global font and color tokens", () => {
    const css = readFileSync(new URL("../css/architecture-precision.css", import.meta.url), "utf8");
    expect(css).not.toMatch(/\.ar-page/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toContain("@font-face");
    expect(css).toContain("prefers-reduced-motion:reduce");
    expect(css).toContain("var(--font-display)");
  });
});
