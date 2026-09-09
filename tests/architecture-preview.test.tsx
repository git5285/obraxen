import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArchitecturePreview from "@/app/[lang]/architecture-preview/page";
import { ArchitectureHome } from "@/components/architecture-home";
import { publicProjects } from "@/lib/projects";

afterEach(() => vi.unstubAllEnvs());
describe("private architecture preview", () => {
  it.each([
    ["production", "local-only", "", "es"], ["development", "", "", "es"],
    ["development", "local-only", "1", "es"], ["development", "local-only", "", "en"],
  ])("fails closed for %s/%s/%s/%s", async (mode, flag, vercel, lang) => {
    vi.stubEnv("NODE_ENV", mode); vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", flag); vi.stubEnv("VERCEL", vercel);
    await expect(ArchitecturePreview({ params: Promise.resolve({ lang }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
  it("renders internal records only under the explicit Spanish local-development gate", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", "local-only"); vi.stubEnv("VERCEL", "");
    const html = renderToStaticMarkup(await ArchitecturePreview({ params: Promise.resolve({ lang: "es" }) }));
    expect(html).toContain("Delticom"); expect(html).toContain("18.084");
    expect(html).toContain("Experiencia del equipo");
    expect(html).not.toContain("data:image/webp;base64,");
    expect(html).toContain("%2Fes%2Farchitecture-preview%2Fmedia%2Fdelticom-hannover%2Fresult%2F");
    expect(html).toContain("%2Fes%2Farchitecture-preview%2Fmedia%2Fhologram-paris%2Finitial%2F");
    expect(html).toContain("Duración documentada");
    expect(html).toContain("2 meses");
    expect(html).toContain("Retirada de 5.362 m² de revestimiento");
    expect(html).not.toContain("/img/proyectos/"); expect(publicProjects).toHaveLength(0);
  });
  it("preserves approved section order, functional details and honest preview boundaries", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    const positions = ["services", "projects", "sectors", "contact"].map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toContain("Artículos aún no publicados"); expect(html).toContain("No envía consultas ni guarda datos.");
    expect(html).toContain('href="mailto:info@obraxen.com"'); expect(html).toContain('href="/de/"');
    expect(html).toContain("/obraxen-wordmark-v14.svg#letra-X"); expect(html).not.toContain("style=");
    expect(html).toContain("architecture-hall-illustrative");
    expect(html).toContain('sizes="100vw"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).not.toContain('(max-width: 700px) 1600px');
    expect(html).not.toContain("ar-photo-text");
    expect(html).not.toContain('id="company"');
    expect(html).not.toContain("El estado de la superficie y el uso del espacio orientan cada consulta.");
    expect(html).not.toContain('id="blog"');
    expect(html).not.toContain('href="#blog"');
    expect(html.match(/class="ar-solution-tech"/g)).toHaveLength(5);
    expect(html).toContain("Cuéntanos la localidad, el uso del espacio y el daño visible.");
    expect(html).not.toContain("Casos y fotografías solo con autorización");
    expect(html).toContain("Selección de intervenciones anteriores de integrantes del equipo.");
    expect(html).not.toContain("24 horas laborables");
    expect(html).toContain("Obraxen Surface S.L.");
    expect(html).toContain("B93963841");
    expect(html).toContain("Calle Federico García Lorca, 22, Málaga");
    expect(html).toContain('href="https://wa.me/34653916970"');
    expect(html).not.toContain('href="/it/"');
    expect(html).not.toContain("24 horas naturales");
    expect(html).toContain('aria-label="Ver alcance técnico: Nivelación y recrecidos"');
    expect(html).toContain('class="ar-button" href="mailto:info@obraxen.com"');
    expect(html).toContain("Imagen ilustrativa generada de una nave diáfana luminosa");
    expect(html).not.toContain("Preguntas frecuentes"); expect(html).not.toContain('class="ar-footer-x"');
    expect(html).toContain('aria-label="Ver alcance técnico: Reparación de pavimentos"');
    expect(html).toContain('<h3>Logística</h3>');
    expect(html).toContain('href="?review=editorial#blog"');
    expect(html).toContain("imágenes ilustrativas, no acreditan obras realizadas.");
  });
  it("renders four solution boxes with four photos each, photographed sectors and compact cases", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso ordenado", city: "Ciudad", country: "País", sector: "Industria", area: null,
      description: "Alcance conservado", problem: "Daño", result: "Resultado", duration: null,
      materials: [], images: [{ src: "/example.jpg", alt: "Foto de apoyo", stage: "Registro", width: 200, height: 100 }],
    }]} />);
    const services = html.slice(html.indexOf('id="services"'), html.indexOf('id="projects"'));
    const articles = [...services.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)];
    expect(articles).toHaveLength(4);
    for (const [, article] of articles) {
      expect(article.match(/<img /g)).toHaveLength(4);
      expect(article.indexOf("<h3")).toBeLessThan(article.indexOf("<img"));
      expect(article).toContain('class="ar-solution-photos"');
      expect(article).toContain('name="architecture-solutions"');
      expect(article).toContain("<figcaption>");
      expect(article.indexOf('class="ar-solution-consult"')).toBeGreaterThan(article.indexOf("</details>"));
      expect(article).toContain('href="#contact" aria-label="Consultar esta solución:');
    }
    expect(articles[0][1]).toContain("Juntas y fisuras: fotografías aportadas. Las otras dos son ilustrativas.");
    expect(articles[0][1]).toContain('alt="Detalle de una junta de dilatación en un pavimento de hormigón"');
    expect(articles[0][1]).toContain('alt="Fisura abierta con bordes deteriorados en un pavimento de hormigón"');
    expect(articles[0][1].match(/alt="Imagen ilustrativa:/g)).toHaveLength(2);
    expect(articles[3][1]).toContain("Epoxi y anclajes: fotografías aportadas. Las otras dos son ilustrativas.");
    expect(articles[3][1]).toContain('alt="Desbastado de epoxi sobre un pavimento industrial azul"');
    expect(articles[3][1]).toContain('alt="Huecos de anclajes retirados en un pavimento de hormigón"');
    expect(articles[3][1].match(/alt="Imagen ilustrativa:/g)).toHaveLength(2);
    for (const [, article] of articles.slice(1, 3)) {
      expect(article).toContain("<figcaption>Imágenes ilustrativas; no acreditan obras realizadas.</figcaption>");
      expect(article.match(/alt="Imagen ilustrativa:/g)).toHaveLength(4);
    }
    const sectors = html.slice(html.indexOf('id="sectors"'), html.indexOf('id="contact"'));
    expect(sectors.match(/<img /g)).toHaveLength(6);
    for (const title of ["Logística", "Industria", "Automoción", "Distribución", "Alimentación", "Aparcamientos"]) {
      expect(sectors).toContain(`<h3>${title}</h3>`);
    }
    expect(sectors).not.toContain("Edificación");
    expect(sectors).toContain("no corresponden a obras de Obraxen");
    const project = html.slice(html.indexOf('class="ar-project ar-project-compact"'), html.indexOf('id="sectors"'));
    expect(project.indexOf("Foto de apoyo")).toBeLessThan(project.indexOf("<details"));
    expect(project.indexOf("Alcance conservado")).toBeLessThan(project.indexOf("<details"));
    expect(project).toContain('aria-label="Ver caso: Caso ordenado, Ciudad"');
  });
  it("keeps every primary CTA square", () => {
    const css = readFileSync(new URL("../css/architecture.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.ar-page \.ar-button\{[^}]*border-radius:0(?:;|})/);
    expect(css).not.toMatch(/\.ar-page \.ar-button\{[^}]*border-radius:(?!0(?:;|}))/);
  });
  it("explains an empty project selection without implying photographs are present", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html).toContain("No hay proyectos disponibles en esta selección.");
    expect(html).toContain('href="#contact">Consultar una necesidad concreta</a>');
    expect(html).toContain('href="#contact">describe tu caso al contactar</a>');
    expect(html).not.toContain("Fotografías del registro documental;");
    expect(html).toContain('id="projects"');
    expect(html).toContain('href="#contact"');
  });
  it("keeps missing case facts explicit and escapes long project content", () => {
    const name = "Proyecto <industrial> de nombre extenso ".repeat(8);
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name, city: "Localidad", country: "País", sector: "Industria", area: null,
      description: "Descripción ".repeat(100), problem: "", result: " ", duration: " ",
      materials: [" "], images: [],
    }]} />);
    expect(html).toContain("Proyecto &lt;industrial&gt;");
    expect(html).toContain("Sin fotografías disponibles para esta selección.");
    expect(html).toContain("Sin superficie total confirmada");
    expect(html.match(/<dd>Sin dato<\/dd>/g)).toHaveLength(2);
    expect(html).toContain("<strong>Problema</strong>Sin dato");
    expect(html).toContain("<strong>Resultado documentado</strong>Sin dato");
    expect(html).not.toContain("Fotografías del registro documental;");
    expect(html).not.toContain("<dd></dd>");
  });
  it("introduces the demonstration before collecting data and keeps real contact primary", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html.indexOf("Formulario de demostración")).toBeLessThan(html.indexOf('id="ar-name"'));
    expect(html).toContain("No envía consultas ni guarda datos.");
    expect(html).toContain("Revisar ejemplo");
    expect(html).not.toContain("Revisar antes de enviar");
    expect(html).toContain('class="ar-demo-button"');
    expect(html).toContain('class="ar-button" href="mailto:info@obraxen.com"');
  });
  it("keeps complete concise case facts in the stable summary", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso", city: "Ciudad", country: "País", sector: "Industria", area: 500,
      description: "Intervención detallada", problem: "Daño localizado.", result: "Superficie saneada. Entrega confirmada.", duration: "Dos semanas", materials: ["Material documentado"], images: [],
    }]} />);
    const start = html.indexOf('class="ar-project ar-project-compact"');
    const details = html.indexOf('<details class="ar-case-full"', start);
    const overview = html.slice(start, details);
    expect(overview).toContain("<strong>Problema</strong>Daño localizado.");
    expect(html.slice(details)).not.toContain("Daño localizado.");
    expect(html.match(/Daño localizado\./g)).toHaveLength(1);
    expect(overview).toContain("Superficie saneada. Entrega confirmada.");
    expect(overview).toContain("Intervención detallada");
    expect(overview).not.toContain("500 m²");
    expect(html.slice(details)).not.toContain("Entrega confirmada.");
    expect(html.slice(details)).not.toContain("Intervención detallada");
    expect(html.match(/Intervención detallada/g)).toHaveLength(1);
    expect(html.slice(details)).toContain("Material documentado");
    expect(html.slice(details)).toContain("Dos semanas");
    expect(html).toContain("Cuéntanos la localidad, el uso del espacio y el daño visible.");
  });
  it("keeps a stable case card and responsive private image candidates", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso", city: "Ciudad", country: "País", sector: "Industria", area: 500,
      description: "Intervención muy detallada con datos documentados que deben quedar disponibles en el desplegable sin dominar el resumen inicial.", problem: "Daño localizado.", result: "Resultado confirmado.", duration: "Dos semanas", materials: ["Material documentado"],
      images: [{ src: "/es/architecture-preview/media/delticom-hannover/result/", alt: "Resultado", stage: "Resultado documentado", width: 1400, height: 646 }],
    }]} />);
    expect(html).toContain("Intervención muy detallada con datos documentados que deben quedar disponibles en el desplegable sin dominar el resumen");
    expect(html).toContain("Intervención completa");
    expect(html).toContain("srcSet=");
    expect(html).toContain('sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1000px) calc(100vw - 64px), 40vw"');
  });
  it("keeps short multi-sentence facts in the summary instead of opening a redundant detail", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso", city: "Ciudad", country: "País", sector: "Industria", area: null,
      description: "Intervención breve. Segundo hecho breve.", problem: "Daño localizado.", result: "Resultado confirmado.", duration: null, materials: [], images: [],
    }]} />);
    expect(html).toContain("Intervención breve. Segundo hecho breve.");
    expect(html).not.toContain("Intervención completa");
  });
  it("introduces needs without replacing technical services and labels the hero illustration", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html).toContain("Cuatro soluciones para tu pavimento");
    expect(html).toContain("Juntas deterioradas, fisuras y daños localizados.");
    expect(html).toContain("Desniveles en el pavimento.");
    expect(html).toContain("Superficies desgastadas que recuperar.");
    expect(html).toContain("Revestimientos existentes que retirar.");
    expect(html).toContain("<h4>Reparación de juntas</h4>");
    expect(html).toContain("Retirada de anclajes, según diagnóstico");
    expect(html).toContain("Parches de hormigón, según diagnóstico");
    expect(html).toContain("No corresponde a una obra acreditada.");
    expect(html.indexOf('class="ar-hero-image"')).toBeLessThan(html.indexOf('id="ar-title"'));
    expect(html).toContain('Reparación de<br/>pavimentos industriales.');
    expect(html).not.toContain("apple.com");
    expect(html).not.toContain("stripe.com");
  });
  it("retains unpublished topics only in the explicit editorial view", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", "local-only"); vi.stubEnv("VERCEL", "");
    const html = renderToStaticMarkup(await ArchitecturePreview({ params: Promise.resolve({lang:"es"}), searchParams:Promise.resolve({review:"editorial"}) }));
    expect(html.match(/id="blog"/g)).toHaveLength(1);
    expect(html).toContain("Artículos aún no publicados");
    expect(html).toContain("Juntas o fisuras: qué observar");
    expect(html).toContain("Volver al recorrido para clientes");
    expect(html.indexOf('id="contact"')).toBeLessThan(html.indexOf('id="blog"'));
  });
  it("keeps direct contact primary, omits removed blocks and keeps the mobile menu edge to edge", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html).not.toContain('id="start"');
    expect(html).not.toContain("¿Qué pasa después?");
    expect(html).not.toContain("Idiomas y ámbito de consulta");
    expect(html.indexOf('class="ar-contact-direct"')).toBeLessThan(html.indexOf('class="ar-contact-form"'));
    expect(html.match(/class="ar-contact-direct"/g)).toHaveLength(1);
    const css = readFileSync(new URL("../css/architecture.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.ar-page \.ar-mobile-menu nav\{left:0;right:0;width:auto/);
    expect(css).toMatch(/\.ar-page \.ar-solution-photos\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
    expect(css).toMatch(/\.ar-page \.ar-case-cover img\{[^}]*object-fit:contain/);
    expect(css).toMatch(/\.ar-page \.ar-solution-grid\{[^}]*align-items:start/);
  });
  it("asks only for name, one contact channel and the need in the short form", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    const form = html.slice(html.indexOf("<form"), html.indexOf("</form>"));
    expect(form).toContain('data-compact="true"');
    expect(form.match(/<input /g)).toHaveLength(2);
    expect(form.match(/<textarea /g)).toHaveLength(1);
    expect(form).toContain("Email o teléfono");
    expect(form).not.toContain('id="ar-country"');
    expect(form).not.toContain('id="ar-city"');
    expect(form).not.toContain('type="file"');
    expect(form).toContain("No envía consultas ni guarda datos.");
    expect(form).not.toContain("Solución elegida");
    expect(form).toContain('placeholder="Localidad, uso del espacio y daño visible."');
  });
});
