import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LogoMark } from "@/components/logo-mark";

describe("LogoMark", () => {
  it("renders the vector mark without replacing its localized accessible name", () => {
    const html = renderToStaticMarkup(
      <LogoMark brandName="Obraxen" href="/es/" homeLabel="Inicio" />,
    );

    expect(html).toContain('href="/es/"');
    expect(html).toContain('aria-label="Obraxen, Inicio"');
    expect(html).toContain('<svg class="logo-symbol" viewBox="0 0 32 32" aria-hidden="true">');
    expect(html).toContain('class="logo-symbol-seam"');
    expect(html).toContain('class="logo-emphasis">x</span>');
  });
});
