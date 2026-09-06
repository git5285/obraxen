import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SectionPage, {
  generateMetadata as generateSectionMetadata,
  generateStaticParams as generateSectionParams,
  getSectionMetadata,
} from "@/app/[lang]/[section]/page";
import ProjectPage, {
  generateMetadata as generateProjectMetadata,
  generateStaticParams as generateProjectParams,
} from "@/app/[lang]/[section]/[slug]/page";
import { brand } from "@/lib/brand";
import { getDictionary, locales, routeSegments } from "@/lib/i18n";
import { internalProjects } from "@/lib/internal-projects";
import { publicProjects } from "@/lib/projects";
import { getProjectJsonLd, getProjectMetadata, getProjectsJsonLd, getProjectsMetadata } from "@/lib/project-pages";
import { publicableOffers } from "@/lib/solutions";
import { isRouteReadyForIndexing } from "@/lib/seo-indexability";

describe("localized project routes", () => {
  it.each(locales)("renders only authorized projects in the %s evidence hub", async (locale) => {
    const html = renderToStaticMarkup(await SectionPage({
      params: Promise.resolve({ lang: locale, section: routeSegments[locale].projects }),
    }));
    expect(html.match(/<article class="project-dossier"/g) ?? []).toHaveLength(publicProjects.length);
    expect(html.match(/<img /g) ?? []).toHaveLength(publicProjects.length * 3);
    for (const project of internalProjects.filter((item) => !publicProjects.includes(item))) {
      expect(html).not.toContain(project.cliente);
      expect(html).not.toContain(project.slug);
    }
    expect(html).toContain(publicProjects.length ? getDictionary(locale).projectHub.title : getDictionary(locale).common.projects);
    expect(html).not.toContain("style=");
    if (brand.nombreTemporalNoPublicable) expect(html).not.toContain(brand.nombreTemporalNoPublicable);
  });

  it("prerenders only authorized project slugs", () => {
    expect(generateSectionParams()).toHaveLength(locales.length * 5);
    expect(generateProjectParams()).toHaveLength(locales.length * publicProjects.length);
  });

  it.each(locales)("renders only authorized project dossiers in %s", async (locale) => {
    for (const project of publicProjects) {
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

  it.each(locales)("keeps unlicensed projects out of %s routes, metadata and JSON-LD", async (locale) => {
    for (const project of internalProjects.filter((item) => !publicProjects.includes(item))) {
      const params = Promise.resolve({
        lang: locale,
        section: routeSegments[locale].projects,
        slug: project.slug,
      });
      await expect(ProjectPage({ params })).rejects.toThrow();
      await expect(generateProjectMetadata({ params })).resolves.toEqual({});
      expect(getProjectMetadata(project, locale, "example.com")).toEqual({});
      expect(getProjectJsonLd(project, locale)).toBeNull();
    }
    const hubJsonLd = getProjectsJsonLd(locale);
    expect(hubJsonLd).toContain(`"numberOfItems":${publicProjects.length}`);
    for (const project of internalProjects.filter((item) => !publicProjects.includes(item))) {
      expect(hubJsonLd).not.toContain(project.slug);
      expect(hubJsonLd).not.toContain(project.cliente);
    }
  });

  it.each(locales)("provides unique %s metadata for the verified domain", async (locale) => {
    const hubMetadata = await generateSectionMetadata({ params: Promise.resolve({
      lang: locale,
      section: routeSegments[locale].projects,
    }) });
    expect(hubMetadata.openGraph).toMatchObject({ type: "website" });
    expect(hubMetadata.alternates).toMatchObject({
      canonical: `https://obraxen.com/${locale}/${routeSegments[locale].projects}/`,
      ...(publicProjects.length ? { languages: { "x-default": "https://obraxen.com/en/projects/" } } : {}),
    });

    const titles = await Promise.all(publicProjects.map(async ({ slug }) => {
      const metadata = await generateProjectMetadata({ params: Promise.resolve({
        lang: locale,
        section: routeSegments[locale].projects,
        slug,
      }) });
      expect(metadata.openGraph).toMatchObject({ type: "article" });
      expect(metadata.alternates).toMatchObject({
        canonical: `https://obraxen.com/${locale}/${routeSegments[locale].projects}/${slug}/`,
        languages: { "x-default": `https://obraxen.com/en/projects/${slug}/` },
      });
      return metadata.title;
    }));
    expect(new Set(titles).size).toBe(publicProjects.length);
  });

  it.each(locales)("provides absolute %s project metadata for a candidate domain", (locale) => {
    const hubMetadata = getProjectsMetadata(locale, "example.com");
    expect(hubMetadata.alternates).toMatchObject({
      canonical: `https://example.com/${locale}/${routeSegments[locale].projects}/`,
      ...(publicProjects.length ? { languages: { "x-default": "https://example.com/en/projects/" } } : {}),
    });

    expect(getProjectMetadata(internalProjects[0], locale, "example.com")).toEqual({});
  });

  it.each(locales)("provides absolute %s legal and contact metadata for a candidate domain", (locale) => {
    for (const route of ["legalNotice", "privacy", "cookies", "contact"] as const) {
      const metadata = getSectionMetadata(locale, route, "example.com");
      expect(metadata.alternates).toMatchObject({
        canonical: `https://example.com/${locale}/${routeSegments[locale][route]}/`,
        ...(isRouteReadyForIndexing(route) ? { languages: {
          "x-default": `https://example.com/en/${routeSegments.en[route]}/`,
        } } : {}),
      });
    }
  });
});

describe("solutions publication gate", () => {
  it("keeps solution routes absent while every offer is internal", () => {
    expect(publicableOffers).toHaveLength(0);
    expect(existsSync(resolve("src/app/[lang]/solutions/page.tsx"))).toBe(false);
  });
});
