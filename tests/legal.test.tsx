import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SectionPage from "@/app/[lang]/[section]/page";
import { getDictionary, locales, routeSegments } from "@/lib/i18n";

describe("localized legal draft routes", () => {
  const obsoleteIdentityClaims = [
    "OBRAXEN SURFACE S.L.",
    "B93963841",
    "Calle Federico García Lorca 22",
    "+34 653 916 970",
    "info@obraxen.com",
    "privacy@obraxen.com",
    "once the company exists",
    "nach Gründung der Gesellschaft",
    "cuando exista la sociedad",
    "après la constitution de la société",
  ];

  for (const locale of locales) {
    const dictionary = getDictionary(locale);
    const routes = [
      ["legalNotice", dictionary.legal.notice.title],
      ["privacy", dictionary.legal.privacy.title],
      ["cookies", dictionary.legal.cookies.title],
    ] as const;

    it.each(routes)(`renders ${locale}/%s as an explicit non-public draft`, async (route, title) => {
      const page = await SectionPage({ params: Promise.resolve({
        lang: locale,
        section: routeSegments[locale][route],
      }) });
      const html = renderToStaticMarkup(page);
      expect(html).toContain(`href="#legal-content"`);
      expect(html).toContain(`<main id="legal-content">`);
      expect(html).toContain(`<h1>${title}</h1>`);
      expect(html).toContain(dictionary.legal.draftStatus);
      expect(html).toContain(dictionary.common.noData);
      for (const obsoleteClaim of obsoleteIdentityClaims) {
        expect(html).not.toContain(obsoleteClaim);
      }
      expect(html).not.toContain(">null<");
      expect(html).not.toContain("RemainOn");
    });
  }
});
