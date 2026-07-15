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

const requiredRouteFiles = [
  "src/app/[lang]/layout.tsx",
  "src/app/[lang]/page.tsx",
  "src/app/[lang]/[section]/page.tsx",
  "src/app/[lang]/[section]/[slug]/page.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/api/analytics-config/route.ts",
  "src/app/api/contact/route.ts",
  "src/components/contact-form.tsx",
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
      "x-default": "/en/projects/blitz-bremen/",
    });
    expect(localizePath("/de/projekte/blitz-bremen/", "fr"))
      .toBe("/fr/projets/blitz-bremen/");
  });

  it("serves a closed robots and sitemap policy before publication", () => {
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(sitemap()).toEqual([]);
  });
});
