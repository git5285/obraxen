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
    expect(spanish).toContain("Delticom");
    expect(spanish).toContain("Vista privada · Propuesta en revisión");
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
      openGraph: { locale: "es_ES", url: "https://obraxen.com/es/" },
    });
  });
});
