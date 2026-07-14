import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LegalNoticePage from "@/app/(legal)/aviso-legal/page";
import CookiesPage from "@/app/(legal)/cookies/page";
import PrivacyPage from "@/app/(legal)/privacidad/page";

describe("legal draft routes", () => {
  it.each([
    ["Aviso legal", <LegalNoticePage key="legal" />],
    ["Cookies y almacenamiento", <CookiesPage key="cookies" />],
    ["Política de privacidad", <PrivacyPage key="privacy" />],
  ])("renders %s as an explicit non-public draft", (title, page) => {
    const html = renderToStaticMarkup(page);
    expect(html).toContain(`<h1>${title}</h1>`);
    expect(html).toContain("Borrador incompleto · no apto para publicación");
    expect(html).toContain("Sin dato");
    expect(html).not.toContain(">null<");
    expect(html).not.toContain("RemainOn");
  });
});
