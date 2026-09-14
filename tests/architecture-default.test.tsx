import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/[lang]/page";
import SpanishHomePage, { metadata as spanishMetadata } from "@/app/es/page";
import { defaultLocale } from "@/lib/i18n";

describe("architecture default home", () => {
  it("uses the architecture experience as the Spanish home while leaving other locales unchanged", async () => {
    const spanish = renderToStaticMarkup(<SpanishHomePage />);
    const english = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: "en" }) }));

    expect(defaultLocale).toBe("es");
    expect(spanish).toContain("Reparación de<br/>pavimentos industriales.");
    expect(spanish).not.toContain("Delticom");
    expect(spanish).toContain("No hay proyectos disponibles en esta selección.");
    expect(spanish).not.toContain("Vista privada · Propuesta en revisión");
    expect(spanish).not.toContain("Revisión editorial interna");
    expect(english).toContain('id="inicio"');
    expect(english).not.toContain("Delticom");
    expect(readFileSync(new URL("../next.config.ts", import.meta.url), "utf8"))
      .toContain('{ source: "/", destination: "/es/", permanent: true }');
  });

  it("gives the Spanish default its architecture metadata", () => {
    expect(spanishMetadata).toMatchObject({
      title: "Obraxen | Reparación de pavimentos industriales",
      description: "Reparación y rehabilitación de pavimentos industriales.",
      alternates: { canonical: "https://obraxen.com/es/" },
      openGraph: {
        locale: "es_ES",
        url: "https://obraxen.com/es/",
        images: [{ url: expect.stringMatching(/^https:\/\/obraxen\.com\/.*architecture-hall-illustrative.*\.png$/) }],
      },
    });
    expect(spanishMetadata.alternates).not.toHaveProperty("languages");
  });

  it("emits only visible, verified organization data as JSON-LD", () => {
    const html = renderToStaticMarkup(<SpanishHomePage />);
    const source = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
    expect(source).toBeDefined();

    const graph = JSON.parse(source!) as { "@graph": Array<Record<string, unknown>> };
    expect(graph["@graph"]).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "Organization", name: "Obraxen" }),
      expect.objectContaining({ "@type": "WebSite", name: "Obraxen", inLanguage: "es" }),
      expect.objectContaining({ "@type": "WebPage", url: "https://obraxen.com/es/", inLanguage: "es" }),
    ]));
    const organization = graph["@graph"].find(item => item["@type"] === "Organization");
    expect(organization).not.toHaveProperty("email");
    expect(organization).not.toHaveProperty("telephone");
    expect(organization).not.toHaveProperty("address");
    expect(JSON.stringify(graph)).not.toMatch(/Obraxen Surface S\.L\.|B93963841|Federico García Lorca|info@obraxen\.com|34653916970/);
    expect(JSON.stringify(graph)).not.toContain("FAQPage");
    expect(JSON.stringify(graph)).not.toContain("LocalBusiness");
  });
});
