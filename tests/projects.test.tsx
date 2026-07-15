import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SectionPage, {
  generateMetadata as generateSectionMetadata,
  generateStaticParams as generateSectionParams,
} from "@/app/[lang]/[section]/page";
import ProjectPage, {
  generateMetadata as generateProjectMetadata,
  generateStaticParams as generateProjectParams,
} from "@/app/[lang]/[section]/[slug]/page";
import { brand } from "@/lib/brand";
import { getDictionary, locales, routeSegments } from "@/lib/i18n";
import { projects } from "@/lib/projects";
import { publicableOffers } from "@/lib/solutions";

describe("localized project routes", () => {
  it.each(locales)("renders the complete %s evidence hub", async (locale) => {
    const html = renderToStaticMarkup(await SectionPage({
      params: Promise.resolve({ lang: locale, section: routeSegments[locale].projects }),
    }));
    expect(html.match(/<article class="project-dossier"/g)).toHaveLength(projects.length);
    expect(html.match(/<img /g)).toHaveLength(projects.length * 3);
    expect(html).toContain(getDictionary(locale).projectHub.title);
    expect(html).not.toContain("style=");
    if (brand.nombreTemporalNoPublicable) expect(html).not.toContain(brand.nombreTemporalNoPublicable);
  });

  it("prerenders every locale, section and approved project slug", () => {
    expect(generateSectionParams()).toHaveLength(locales.length * 5);
    expect(generateProjectParams()).toHaveLength(locales.length * projects.length);
  });

  it.each(locales)("renders all project dossiers in %s", async (locale) => {
    for (const project of projects) {
      const page = await ProjectPage({ params: Promise.resolve({
        lang: locale,
        section: routeSegments[locale].projects,
        slug: project.slug,
      }) });
      const html = renderToStaticMarkup(page).replaceAll("&#x27;", "'");
      expect(html).toContain(project.traducciones[locale].titulo);
      expect(html).toContain(project.referencia);
      expect(html.match(/<img /g)).toHaveLength(project.imagenes.length);
      expect(html).not.toContain("style=");
    }
  });

  it.each(locales)("provides unique %s metadata without inventing a domain", async (locale) => {
    const hubMetadata = await generateSectionMetadata({ params: Promise.resolve({
      lang: locale,
      section: routeSegments[locale].projects,
    }) });
    expect(hubMetadata.openGraph).toMatchObject({ type: "website" });
    expect(hubMetadata.alternates).toBeUndefined();

    const titles = await Promise.all(projects.map(async ({ slug }) => {
      const metadata = await generateProjectMetadata({ params: Promise.resolve({
        lang: locale,
        section: routeSegments[locale].projects,
        slug,
      }) });
      expect(metadata.openGraph).toMatchObject({ type: "article" });
      expect(metadata.alternates).toBeUndefined();
      return metadata.title;
    }));
    expect(new Set(titles).size).toBe(projects.length);
  });
});

describe("solutions publication gate", () => {
  it("keeps solution routes absent while every offer is internal", () => {
    expect(publicableOffers).toHaveLength(0);
    expect(existsSync(resolve("src/app/[lang]/solutions/page.tsx"))).toBe(false);
  });
});
