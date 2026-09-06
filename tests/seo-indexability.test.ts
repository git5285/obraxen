import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const state = vi.hoisted(() => ({
  isPublic: false,
  contact: false,
  projects: [] as Array<{ slug: string }>,
}));
vi.mock("@/lib/publication", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/publication")>(),
  getPublicPublicationState: () => ({ isPublic: state.isPublic }),
}));
vi.mock("@/lib/contact", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/contact")>(),
  resolveContactConfig: () => ({ enabled: state.contact }),
}));
vi.mock("@/lib/projects", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/projects")>(),
  publicProjects: state.projects,
}));

import sitemap from "@/app/sitemap";
import SectionPage, { getSectionMetadata } from "@/app/[lang]/[section]/page";
import { getProjectsJsonLd, getProjectsMetadata } from "@/lib/project-pages";
import { getLocalizedPaths, getPath, locales, routeSegments } from "@/lib/i18n";
import { emptyProjectsDescription, getRouteSeo } from "@/lib/seo-indexability";

beforeEach(() => { state.isPublic = false; state.contact = false; state.projects.length = 0; });

describe("SEO availability stays independent of publication", () => {
  it("keeps the preview sitemap empty even when contact and projects become available", () => {
    state.contact = true;
    state.projects.push({ slug: "seo-fixture" });
    expect(sitemap()).toEqual([]);
  });

  it("restores project hubs and reciprocal language clusters when a public project exists", () => {
    state.isPublic = true;
    state.projects.push({ slug: "seo-fixture" });
    const entries = sitemap();
    expect(entries).toHaveLength(24);
    for (const slug of [undefined, "seo-fixture"]) {
      const languages = Object.fromEntries(
        Object.entries(getLocalizedPaths("projects", slug)).map(([lang, path]) => [lang, `https://obraxen.com${path}`]),
      );
      for (const locale of locales) {
        const url = `https://obraxen.com${getPath(locale, "projects", slug)}`;
        expect(entries.find(entry => entry.url === url)?.alternates?.languages).toEqual(languages);
        for (const target of Object.values(languages)) {
          expect(entries.find(entry => entry.url === target)?.alternates?.languages).toEqual(languages);
        }
        if (!slug) {
          const metadata = getRouteSeo("obraxen.com", locale, "projects");
          expect(metadata.robots).toBeUndefined();
          expect(metadata.alternates).toEqual({ canonical: url, languages });
        }
      }
    }
  });

  it("excludes empty project hubs and disabled contact from a public sitemap", () => {
    state.isPublic = true;
    const entries = sitemap();
    expect(entries).toHaveLength(16);
    for (const locale of locales) {
      for (const route of ["projects", "contact"] as const) {
        expect(entries.some(e => e.url === `https://obraxen.com${getPath(locale, route)}`)).toBe(false);
      }
    }
    for (const entry of entries) {
      const targets = Object.values(entry.alternates?.languages ?? {});
      expect(targets).toContain(entry.url);
      for (const target of targets) {
        const counterpart = entries.find(e => e.url === target);
        expect(counterpart?.alternates?.languages).toEqual(entry.alternates?.languages);
      }
    }
  });

  it("restores contact and its reciprocal language cluster when contact is available", () => {
    state.isPublic = true;
    state.contact = true;
    expect(sitemap()).toHaveLength(20);
    for (const locale of locales) {
      const metadata = getSectionMetadata(locale, "contact");
      expect(metadata.robots).toBeUndefined();
      expect(metadata.alternates?.languages).toEqual(Object.fromEntries(
        Object.entries(getLocalizedPaths("contact")).map(([lang, path]) => [lang, `https://obraxen.com${path}`]),
      ));
    }
  });

  it.each(locales)("marks unavailable %s routes noindex without advertising noindex alternatives", async (locale) => {
    state.isPublic = true;
    for (const metadata of [getProjectsMetadata(locale), getSectionMetadata(locale, "contact")]) {
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toMatch(/^https:\/\/obraxen\.com\//);
      expect(metadata.alternates?.languages).toBeUndefined();
    }
    const html = renderToStaticMarkup(await SectionPage({
      params: Promise.resolve({ lang: locale, section: routeSegments[locale].projects }),
    })).replaceAll("&#x27;", "'");
    expect(html).toContain(emptyProjectsDescription[locale]);
    expect(getProjectsMetadata(locale).description).toBe(emptyProjectsDescription[locale]);
    const graph = JSON.parse(getProjectsJsonLd(locale))["@graph"];
    expect(graph.find((node: { "@type": string }) => node["@type"] === "CollectionPage").description)
      .toBe(emptyProjectsDescription[locale]);
  });
});
