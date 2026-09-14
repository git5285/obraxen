import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArchitecturePreview from "@/app/[lang]/architecture-preview/page";
import { ArchitectureHome } from "@/components/architecture-home";
import { ResponsiveImage } from "@/components/responsive-image";
import { publicProjects } from "@/lib/projects";

afterEach(() => vi.unstubAllEnvs());
describe("private architecture preview", () => {
  it("defers non-critical responsive images while preserving an explicit eager hero", () => {
    const lazy = renderToStaticMarkup(<ResponsiveImage src="/example.jpg" width={400} height={200} alt="Imagen secundaria" />);
    const eager = renderToStaticMarkup(<ResponsiveImage src="/example.jpg" width={400} height={200} alt="Hero" loading="eager" fetchPriority="high" />);
    const priority = renderToStaticMarkup(<ResponsiveImage src="/example.jpg" width={400} height={200} alt="Hero heredado" priority />);
    expect(lazy).toContain('loading="lazy"');
    expect(eager).toContain('loading="eager"');
    expect(eager).toContain('fetchPriority="high"');
    expect(priority).not.toContain('loading="lazy"');
  });
  it.each([
    ["production", "local-only", "", "es"], ["development", "", "", "es"],
    ["development", "local-only", "1", "es"], ["development", "local-only", "", "en"],
  ])("fails closed for %s/%s/%s/%s", async (mode, flag, vercel, lang) => {
    vi.stubEnv("NODE_ENV", mode); vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", flag); vi.stubEnv("VERCEL", vercel);
    await expect(ArchitecturePreview({ params: Promise.resolve({ lang }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
  it("keeps redacted project records unavailable under the explicit Spanish local-development gate", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", "local-only"); vi.stubEnv("VERCEL", "");
    const html = renderToStaticMarkup(await ArchitecturePreview({ params: Promise.resolve({ lang: "es" }) }));
    expect(html).not.toContain("Delticom"); expect(html).not.toContain("18.084");
    expect(html).toContain("<h2>Proyectos</h2>");
    expect(html).not.toContain("data:image/webp;base64,");
    expect(html).not.toContain("architecture-preview/media");
    expect(html).toContain("No hay proyectos disponibles en esta selección.");
    expect(html).not.toContain("/img/proyectos/"); expect(publicProjects).toHaveLength(0);
  });
  it("preserves approved section order, functional details and honest preview boundaries", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    const positions = ["services", "projects", "sectors", "contact"].map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toContain("Artículos aún no publicados"); expect(html).not.toContain("Formulario de demostración");
    expect(html).not.toContain('href="mailto:');
    for (const code of ["en", "de", "fr"]) expect(html).not.toContain(`href="/${code}/"`);
    expect(html).toContain("Esta versión está disponible en español.");
    expect(html.match(/class="ar-language-unavailable"/g)).toHaveLength(3);
    expect(html).toContain("/obraxen-wordmark-v14.svg#letra-X"); expect(html).not.toContain("style=");
    expect(readFileSync(new URL("../src/components/architecture-home.tsx", import.meta.url), "utf8"))
      .toContain('className="ar-hero-image" src={temporaryRenewLogistics}');
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
    expect(html).not.toContain("Indica la localidad, el uso del espacio y el daño visible.");
    expect(html).not.toContain("Casos y fotografías solo con autorización");
    expect(html).not.toContain("Selección de intervenciones anteriores de integrantes del equipo.");
    expect(html).not.toContain("Vista privada · Propuesta en revisión");
    expect(html).not.toContain('class="ar-hero-caption"');
    expect(html).not.toContain("24 horas laborables");
    expect(html).not.toContain("Obraxen Surface S.L.");
    expect(html).not.toContain("B93963841");
    expect(html).not.toContain("Calle Federico García Lorca, 22, Málaga");
    expect(html).not.toContain('href="https://wa.me/34653916970"');
    expect(html).not.toContain('href="/it/"');
    expect(html).not.toContain("24 horas naturales");
    expect(html).toContain('aria-label="Ver servicios y alcance: Nivelación y recrecidos"');
    expect(html).not.toContain('class="ar-button" href="mailto:');
    expect(html).toContain("Contacto directo pendiente de validación.");
    expect(html).toContain("Pavimento industrial en una nave logística");
    expect(html).not.toContain("Preguntas frecuentes"); expect(html).not.toContain('class="ar-footer-x"');
    expect(html).toContain('aria-label="Ver servicios y alcance: Reparación de pavimentos"');
    expect(html).toContain('<h3>Logística</h3>');
    expect(html).not.toContain('href="?review=editorial#blog"');
    expect(html).not.toContain("Fotografía aportada");
    expect(html).not.toContain("Imagen ilustrativa");
    expect(html).not.toContain("El hero, parte de las soluciones");
    expect(html.match(/>Cuéntanos tu caso</g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).not.toContain("Pedir consulta");
    expect(html).not.toContain("Describir una necesidad");
  });
  it("renders four solution routes with evidence-first galleries, photographed sectors and compact cases", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso ordenado", city: "Ciudad", country: "País", sector: "Industria", area: null,
      description: "Alcance conservado", problem: "Daño", result: "Resultado", duration: null,
      materials: [], images: [{ src: "/example.jpg", alt: "Foto de apoyo", stage: "Registro", width: 200, height: 100 }],
    }]} />);
    const services = html.slice(html.indexOf('id="services"'), html.indexOf('id="projects"'));
    const articles = [...services.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)];
    expect(articles).toHaveLength(4);
    expect(articles.map(([, article]) => article.match(/<h3[^>]*>([^<]+)<\/h3>/)?.[1])).toEqual([
      "Reparación de pavimentos",
      "Pulido y rehabilitación",
      "Nivelación y recrecidos",
      "Retirada y preparación del soporte",
    ]);
    for (const [, article] of articles) {
      expect(article.indexOf("<h3")).toBeLessThan(article.indexOf("<img"));
      expect(article).toContain('class="ar-solution-photos"');
      expect(article).not.toContain('name="architecture-solutions"');
      expect(article).not.toContain("<figcaption>");
      expect(article.indexOf('class="ar-solution-consult"')).toBeGreaterThan(article.indexOf("</details>"));
      expect(article).toContain('href="#contact" aria-label="Consultar esta solución:');
    }
    expect(articles[0][1].match(/<img /g)).toHaveLength(4);
    expect(articles[0][1]).toContain('alt="Junta de dilatación deteriorada en un pavimento de hormigón"');
    expect(articles[0][1]).toContain('alt="Fisura abierta con bordes deteriorados en un pavimento de hormigón"');
    expect(articles[0][1]).toContain('alt="Junta longitudinal abierta sobre una superficie de hormigón"');
    expect(articles[0][1]).toContain('alt="Grieta con pérdida de material en una losa de hormigón"');
    expect(articles[3][1].match(/<img /g)).toHaveLength(4);
    expect(articles[3][1]).toContain('alt="Desbastado de epoxi sobre un pavimento industrial azul"');
    expect(articles[3][1]).toContain('alt="Huecos de anclajes retirados en un pavimento de hormigón"');
    expect(articles[3][1]).toContain('alt="Corte y preparación mecánica de una superficie industrial"');
    expect(articles[3][1]).toContain('alt="Aplicación de una imprimación sobre una superficie de hormigón"');
    expect(articles[1][1]).not.toContain("renew-logistics");
    expect(articles[1][1]).toContain("hero-floor");
    for (const [, article] of articles.slice(1, 3)) {
      expect(article.match(/<img /g)).toHaveLength(4);
      expect(article).not.toContain("<figcaption>");
      expect(article).not.toContain('alt="Imagen ilustrativa:');
    }
    const sectors = html.slice(html.indexOf('id="sectors"'), html.indexOf('id="contact"'));
    expect(sectors.match(/<img /g)).toHaveLength(6);
    for (const title of ["Logística", "Industria", "Automoción", "Distribución", "Alimentación", "Aparcamientos"]) {
      expect(sectors).toContain(`<h3>${title}</h3>`);
    }
    expect(sectors).not.toContain("Edificación");
    expect(sectors).not.toContain("Imágenes de referencia de los sectores, no de obras ejecutadas.");
    const project = html.slice(html.indexOf('class="ar-project ar-project-compact"'), html.indexOf('id="sectors"'));
    expect(project.indexOf("Foto de apoyo")).toBeLessThan(project.indexOf("<details"));
    expect(project).toContain("Alcance conservado");
    expect(project).toContain("<dt>Superficie</dt><dd>Sin dato</dd>");
    expect(project).toContain("<dt>Duración</dt><dd>Sin dato</dd>");
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
    expect(html).toContain('href="#contact">Cuéntanos tu caso</a>');
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
    expect(html.match(/<dd>Sin dato<\/dd>/g)).toHaveLength(6);
    expect(html).toContain("<strong>Resultado</strong>Sin dato");
    expect(html).not.toContain("Fotografías del registro documental;");
    expect(html).not.toContain("<dd></dd>");
  });
  it("restores the compact local-review form behind the existing contact-activation gate", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html).toContain("Cuéntanos tu caso");
    expect(html).not.toContain("Prepara tu consulta");
    expect(html).not.toContain("Resume el caso una vez. Después podrás enviarlo por correo o WhatsApp.");
    expect(html).toContain('<input id="ar-name" autoComplete="name"');
    expect(html).toContain('name="name"');
    expect(html).toContain('<input id="ar-contact" type="text" autoComplete="on"');
    expect(html).toContain('name="contact"');
    expect(html).not.toContain("Antes de enviar, revisarás el mensaje y elegirás correo o WhatsApp. No se envía automáticamente.");
    expect(html).toContain("Puedes preparar una consulta para revisar los datos. Los canales de envío se habilitarán cuando el contacto esté validado.");
    expect(html.indexOf('id="ar-send-help"')).toBeLessThan(html.indexOf('class="ar-form-actions"'));
    expect(html).toContain('aria-describedby="ar-send-help"');
    expect(html).toContain('<textarea id="ar-need" rows="3" required="" maxLength="2000"');
    expect(readFileSync(new URL("../src/components/architecture-home.tsx", import.meta.url), "utf8")).toContain("<ContactForm");
    expect(html).not.toContain("Formulario de demostración");
    expect(html).not.toContain("Revisar ejemplo");
    expect(html).not.toContain('class="ar-button" href="mailto:');
    expect(html).toContain("Preparar consulta");
    const controls = readFileSync(new URL("../src/components/architecture-controls.tsx", import.meta.url), "utf8");
    expect(controls).toContain("Enviar por WhatsApp");
    expect(controls).toContain("Enviar por correo");
    expect(html).toContain("ar-contact-form");
    expect(html).toContain("Contacto directo pendiente de validación.");
  });
  it("keeps complete concise case facts in the stable summary", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso", city: "Ciudad", country: "País", sector: "Industria", area: 500,
      description: "Intervención detallada", problem: "Daño localizado.", result: "Superficie saneada. Entrega confirmada.", duration: "Dos semanas", materials: ["Material documentado"], images: [],
    }]} />);
    const start = html.indexOf('class="ar-project ar-project-compact"');
    const details = html.indexOf('<details class="ar-case-full"', start);
    const overview = html.slice(start, details);
    expect(overview).toContain("<dt>Superficie</dt><dd>500 m²</dd>");
    expect(overview).toContain("<dt>Duración</dt><dd>Dos semanas</dd>");
    expect(overview).toContain("Superficie saneada. Entrega confirmada.");
    expect(overview).toContain("Intervención detallada");
    expect(overview.indexOf("Intervención detallada")).toBeLessThan(overview.indexOf("Superficie saneada. Entrega confirmada."));
    expect(overview).not.toContain("Daño localizado.");
    expect(overview).toContain('class="ar-case-attribution">Intervención anterior de integrantes del equipo.</p>');
    const detailMarkup = html.slice(details, html.indexOf("</article>", details));
    expect(detailMarkup).toContain("<dt>Problema</dt><dd>Daño localizado.</dd>");
    expect(detailMarkup).toContain("<dt>Intervención</dt><dd>Intervención detallada</dd>");
    expect(detailMarkup).toContain("<dt>Resultado documentado</dt><dd>Superficie saneada. Entrega confirmada.</dd>");
    expect(detailMarkup).toContain("Material documentado");
    expect(detailMarkup).toContain("Dos semanas");
    expect(detailMarkup).not.toContain("Intervención anterior de integrantes del equipo.");
    expect(html).not.toContain("Indica la localidad, el uso del espacio y el daño visible.");
  });
  it("keeps a stable case card and responsive private image candidates", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso", city: "Ciudad", country: "País", sector: "Industria", area: 500,
      description: "Intervención muy detallada con datos documentados que deben quedar disponibles en el desplegable sin dominar el resumen inicial.", problem: "Daño localizado.", result: "Resultado confirmado.", duration: "Dos semanas", materials: ["Material documentado"],
      images: [{ src: "/es/architecture-preview/media/redacted/result/", alt: "Resultado", stage: "Resultado documentado", width: 1400, height: 646 }],
    }]} />);
    expect(html).toContain("Intervención muy detallada con datos documentados que deben quedar disponibles en el desplegable sin dominar el resumen");
    expect(html).toContain("<dt>Intervención</dt>");
    expect(html).toContain("srcSet=");
    expect(html).toContain('sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1100px) calc((100vw - 96px) / 2), (max-width: 1360px) calc((100vw - 144px) / 2), 608px"');
  });
  it("keeps short multi-sentence facts in the summary instead of opening a redundant detail", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[{
      name: "Caso", city: "Ciudad", country: "País", sector: "Industria", area: null,
      description: "Intervención breve. Segundo hecho breve.", problem: "Daño localizado.", result: "Resultado confirmado.", duration: null, materials: [], images: [],
    }]} />);
    expect(html).toContain("Intervención breve. Segundo hecho breve.");
    expect(html.match(/Intervención breve\. Segundo hecho breve\./g)).toHaveLength(2);
  });
  it("keeps concise section headings and an accessible hero image", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html).toContain("<h2>Soluciones</h2>");
    expect(html).toContain("<h2>Proyectos</h2>");
    expect(html).toContain("<h2>Sectores en los que trabajamos</h2>");
    expect(html).not.toContain("Elige según el daño visible");
    expect(html).not.toContain("Consulta cada caso por problema");
    expect(html).not.toContain("El uso, el tránsito y los accesos orientan la intervención.");
    expect(html).not.toContain("Daño visible");
    expect(html).not.toContain("Juntas deterioradas, fisuras y daños localizados.");
    expect(html).not.toContain("Desniveles en el pavimento.");
    expect(html).not.toContain("Superficies desgastadas que recuperar.");
    expect(html).not.toContain("Revestimientos existentes que retirar.");
    expect(html).toContain("<h4>Reparación de juntas</h4>");
    expect(html).toContain("Retirada de anclajes, según diagnóstico");
    expect(html).toContain("Parches de hormigón, según diagnóstico");
    expect(html).not.toContain("No corresponde a una obra acreditada.");
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
  it("keeps the form primary, direct contact secondary and the mobile menu edge to edge", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html).not.toContain('id="start"');
    expect(html).not.toContain("¿Qué pasa después?");
    expect(html).not.toContain("Idiomas y ámbito de consulta");
    expect(html).not.toContain('class="ar-contact-heading"');
    expect(html).not.toContain('id="ar-demo-notice"');
    expect(html.indexOf('class="ar-contact-form"')).toBeLessThan(html.indexOf('class="ar-contact-direct"'));
    expect(html.match(/class="ar-contact-direct"/g)).toHaveLength(1);
    expect(html).toContain('class="ar-form-support"');
    const css = readFileSync(new URL("../css/architecture.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.ar-page \.ar-mobile-menu nav\{left:0;right:0;width:auto/);
    expect(css).toMatch(/\.ar-page \.ar-solution-photos\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
    expect(css).toMatch(/\.ar-page \.ar-case-cover img\{[^}]*object-fit:contain/);
    expect(css).toMatch(/@media\(min-width:1001px\)\{\.ar-page\.ar-home \.ar-case-grid\{grid-template-columns:minmax\(0,1\.2fr\) minmax\(0,1fr\)\}\}/);
    expect(css).toMatch(/\.ar-page\.ar-home \.ar-solution-grid\{[^}]*grid-auto-rows:auto[^}]*align-items:start/);
    expect(css).not.toContain(".ar-solution-grid:not(:has(.ar-solution-details[open]))");
    expect(css).toMatch(/\.ar-page\.ar-home \.ar-solution-services\{min-height:5\.125rem/);
    expect(css).toMatch(/@media\(max-width:700px\)\{[\s\S]*\.ar-page\.ar-home \.ar-solution-grid\{[^}]*grid-auto-rows:auto/);
    expect(css).toMatch(/@media\(max-width:700px\)\{[\s\S]*\.ar-page\.ar-home \.ar-solution-photos\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
    expect(css).toMatch(/\.ar-page\.ar-home \.ar-solution-services\{display:none;min-height:0\}/);
    expect(css).toMatch(/\.ar-page \.ar-case-metrics\{display:grid/);
    expect(css).toMatch(/\.ar-page\.ar-home \.ar-hero::after\{[^}]*linear-gradient\(90deg/);
    expect(css).toMatch(/\.ar-page\.ar-home \.ar-hero-copy\{[^}]*z-index:1[^}]*color:var\(--brand-on-dark\)/);
    expect(css).not.toContain("filter:brightness(1.08)");
    expect(css).toMatch(/@media\(max-width:700px\)\{[\s\S]*\.ar-page\.ar-home \.ar-hero::after\{[^}]*linear-gradient\(180deg/);
    expect(css).toContain(".ar-page.ar-home .ar-services{padding-block:1rem 2rem}");
    expect(css).not.toContain(".ar-page.ar-home .ar-services{padding:1rem 2rem 2rem}");
  });
  it("keeps solution enquiries inside the recovered visible contact form", () => {
    const html = renderToStaticMarkup(<ArchitectureHome projects={[]} />);
    expect(html).toContain('class="ar-contact-form" data-compact="true" data-state="preparing"');
    expect(html.match(/href="#contact"/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).not.toContain('href="/es/contacto/"');
  });
});
