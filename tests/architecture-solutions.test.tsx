import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SpanishSolutionsPage, { metadata } from "@/app/es/soluciones/page";

describe("Spanish solutions prototype", () => {
  it("keeps a Spanish technical decision page with four evidence galleries", () => {
    const html = renderToStaticMarkup(<SpanishSolutionsPage />);
    expect(html).toContain('class="ar-page ar-solutions"');
    expect(html).toContain("Elegir una intervención empieza por entender el pavimento.");
    expect(html).toContain('href="/es/soluciones/"');
    expect(html).toContain('href="/es/#projects"');
    expect(html.match(/class="ar-solution-dossier"/g)).toHaveLength(4);
    expect(html.match(/class="ar-solution-dossier-gallery"/g)).toHaveLength(4);
    expect(html.match(/Imágenes ilustrativas; no acreditan obras realizadas por Obraxen\./g)).toHaveLength(4);
    expect(html.match(/Consultar esta solución:/g)).toHaveLength(4);
    for (const title of ["Reparación de pavimentos", "Nivelación y recrecidos", "Pulido y rehabilitación", "Retirada y preparación del soporte"]) expect(html).toContain(title);
    expect(html).toContain("No se realiza ningún diagnóstico ni se envía información automáticamente desde esta página.");
    expect(html).toContain('id="ar-contact-title"');
    expect(html.match(/class="ar-language-unavailable"/g)).toHaveLength(3);
    expect(html).not.toContain('href="/en/soluciones/"');
  });

  it("uses precise Spanish metadata without international alternates", () => {
    expect(metadata.title).toBe("Soluciones | Obraxen");
    expect(metadata.description).toBe("Soluciones para reparar, nivelar, rehabilitar y preparar pavimentos industriales.");
    expect(metadata.openGraph).toMatchObject({ locale: "es_ES", type: "website" });
    expect(metadata.alternates).not.toMatchObject({ languages: expect.anything() });
  });
});
