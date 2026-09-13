import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  getLocalizedPaths,
  getPath,
  locales,
  localizePath,
  routeSegments,
} from "@/lib/i18n";
import { getLocalizedAlternates } from "@/lib/metadata";

const requiredRouteFiles = [
  "src/app/not-found.tsx",
  "src/app/not-found.module.css",
  "src/app/global-not-found.tsx",
  "src/app/[lang]/layout.tsx",
  "src/app/[lang]/page.tsx",
  "src/app/[lang]/[section]/page.tsx",
  "src/app/[lang]/[section]/[slug]/page.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/api/analytics-config/route.ts",
  "src/app/api/contact-config/route.ts",
  "src/app/api/contact/route.ts",
  "src/components/contact-form.tsx",
  "src/components/contact-runtime-gate.tsx",
  "src/components/consent-manager.tsx",
  "src/components/language-switcher.tsx",
  "src/components/site-navigation.tsx",
];

describe("localized foundation routes", () => {
  it.each(requiredRouteFiles)("defines %s", (path) => {
    expect(existsSync(resolve(path))).toBe(true);
  });

  it("uses distinct readable paths for every locale", () => {
    expect(new Set(locales.map((locale) => routeSegments[locale].projects)).size).toBe(4);
    for (const locale of locales) {
      expect(getPath(locale, "home")).toBe(`/${locale}/`);
      expect(getPath(locale, "projects")).toContain(routeSegments[locale].projects);
    }
  });

  it("maps exact language counterparts and x-default without changing case slugs", () => {
    expect(getLocalizedPaths("projects", "blitz-bremen")).toMatchObject({
      en: "/en/projects/blitz-bremen/",
      de: "/de/projekte/blitz-bremen/",
      es: "/es/proyectos/blitz-bremen/",
      fr: "/fr/projets/blitz-bremen/",
      "x-default": "/es/proyectos/blitz-bremen/",
    });
    expect(localizePath("/de/projekte/blitz-bremen/", "fr"))
      .toBe("/fr/projets/blitz-bremen/");
  });

  it("falls back to the target home while preserving valid hashes", () => {
    expect(localizePath("/outside-route/#contact", "es")).toBe("/es/#contact");
    expect(localizePath("/en/#content", "de")).toBe("/de/#content");
    expect(localizePath("/pt/unknown/#hero", "fr")).toBe("/fr/#hero");
    expect(localizePath("/en/unknown/#hero", "fr")).toBe("/fr/");
  });

  it("builds absolute canonical and hreflang URLs when a candidate domain exists", () => {
    expect(getLocalizedAlternates("example.com", "de", "projects", "blitz-bremen"))
      .toEqual({
        canonical: "https://example.com/de/projekte/blitz-bremen/",
        languages: {
          en: "https://example.com/en/projects/blitz-bremen/",
          de: "https://example.com/de/projekte/blitz-bremen/",
          es: "https://example.com/es/proyectos/blitz-bremen/",
          fr: "https://example.com/fr/projets/blitz-bremen/",
          "x-default": "https://example.com/es/proyectos/blitz-bremen/",
        },
      });
  });

  it("does not emit absolute alternates without a verified domain", () => {
    expect(getLocalizedAlternates(null, "en", "home")).toBeUndefined();
  });

  it("serves a closed robots and sitemap policy before publication", () => {
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(sitemap()).toEqual([]);
  });
});
