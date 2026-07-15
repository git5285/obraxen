import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SectionPage from "@/app/[lang]/[section]/page";
import { getDictionary, locales, routeSegments } from "@/lib/i18n";

describe("localized legal draft routes", () => {
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
      expect(html).toContain(`<h1>${title}</h1>`);
      expect(html).toContain(dictionary.legal.draftStatus);
      expect(html).toContain(dictionary.common.noData);
      expect(html).not.toContain(">null<");
      expect(html).not.toContain("RemainOn");
    });
  }
});
