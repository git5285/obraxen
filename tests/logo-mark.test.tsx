import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { LogoMark } from "@/components/logo-mark";

describe("LogoMark", () => {
  it.each(["Obraxen", "OBRAXEN"])("renders approved v14 for %s without duplicate accessible names", (brandName) => {
    const html = renderToStaticMarkup(
      <LogoMark brandName={brandName} href="/es/" homeLabel="Inicio" />,
    );

    expect(html).toContain('href="/es/"');
    expect(html).toContain(`aria-label="${brandName}, Inicio"`);
    for (const letter of ["O", "B", "R", "A", "X", "E", "N"]) {
      expect(html).toContain(`href="/obraxen-wordmark-v14.svg#letra-${letter}"`);
    }
    expect(html.match(/<use /g)).toHaveLength(7);
    expect(html).toContain('class="logo-wordmark"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('viewBox="-24 -33 876 166"');
    expect(html).not.toContain('<img ');
    expect(html).not.toContain('style=');
    expect(html).not.toContain('logo-symbol');
    expect(html).not.toContain('logo-emphasis');
  });

  it("keeps an unnamed brand unbranded and preserves the home destination", () => {
    const html = renderToStaticMarkup(<LogoMark brandName={null} href="/fr/" homeLabel="Accueil" />);
    expect(html).toContain('aria-label="Accueil"');
    expect(html).toContain('href="/fr/"');
    expect(html).toContain('logo-provisional');
    expect(html).not.toContain('obraxen-wordmark');
  });

  it("does not replace an unrelated brand name with Obraxen artwork", () => {
    const html = renderToStaticMarkup(<LogoMark brandName="Example" href="/en/" />);
    expect(html).toContain('aria-label="Example, Home"');
    expect(html).not.toContain('obraxen-wordmark');
  });

  it("preserves the approved source assets byte for byte and includes small favicon sizes", () => {
    const svg = readFileSync(new URL("../public/obraxen-wordmark-v14.svg", import.meta.url));
    const ico = readFileSync(new URL("../public/obraxen-favicon-v14.ico", import.meta.url));
    expect(createHash("sha256").update(svg).digest("hex")).toBe("6efe73ea1e3881d1244d1e73415550ef3f5ce86f32ec0a07c2276d6ce261cbde");
    expect(createHash("sha256").update(ico).digest("hex")).toBe("b2d4b7bee37bcc6e588164b431dc29fee80f1085f13b5d4d28dea9d859dc5418");
    expect(ico.readUInt16LE(2)).toBe(1);
    const sizes = Array.from({ length: ico.readUInt16LE(4) }, (_, index) => (
      [ico[6 + index * 16] || 256, ico[7 + index * 16] || 256]
    ));
    expect(sizes).toContainEqual([16, 16]);
    expect(sizes).toContainEqual([32, 32]);
  });
});
