import { de } from "./dictionaries/de";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { fr } from "./dictionaries/fr";
import type { Dictionary } from "./dictionaries/types";

export const locales = ["en", "de", "es", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
};

export const openGraphLocales: Record<Locale, string> = {
  en: "en_GB",
  de: "de_DE",
  es: "es_ES",
  fr: "fr_FR",
};

export type RouteKey =
  | "home"
  | "projects"
  | "legalNotice"
  | "privacy"
  | "cookies"
  | "contact";

type LocalizedSegments = Record<Exclude<RouteKey, "home">, string>;

export const routeSegments: Record<Locale, LocalizedSegments> = {
  en: {
    projects: "projects",
    legalNotice: "legal-notice",
    privacy: "privacy",
    cookies: "cookies",
    contact: "contact",
  },
  de: {
    projects: "projekte",
    legalNotice: "impressum",
    privacy: "datenschutz",
    cookies: "cookies",
    contact: "kontakt",
  },
  es: {
    projects: "proyectos",
    legalNotice: "aviso-legal",
    privacy: "privacidad",
    cookies: "cookies",
    contact: "contacto",
  },
  fr: {
    projects: "projets",
    legalNotice: "mentions-legales",
    privacy: "confidentialite",
    cookies: "cookies",
    contact: "contact",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, de, es, fr };

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getPath(locale: Locale, route: RouteKey, slug?: string): string {
  const base = route === "home"
    ? `/${locale}/`
    : `/${locale}/${routeSegments[locale][route]}/`;
  return slug ? `${base}${slug}/` : base;
}

export function getRouteForSection(locale: Locale, section: string): RouteKey | null {
  const match = Object.entries(routeSegments[locale]).find(([, value]) => value === section);
  return (match?.[0] as RouteKey | undefined) ?? null;
}

export function getLocalizedPaths(route: RouteKey, slug?: string): Record<string, string> {
  return Object.fromEntries([
    ...locales.map((locale) => [locale, getPath(locale, route, slug)]),
    ["x-default", getPath(defaultLocale, route, slug)],
  ]);
}

export function getLanguageLinks(
  currentLocale: Locale,
  route: RouteKey,
  slug?: string,
) {
  const dictionary = getDictionary(currentLocale);
  return locales.map((locale) => ({
    locale,
    name: localeNames[locale],
    href: getPath(locale, route, slug),
    current: locale === currentLocale,
    ariaLabel: `${dictionary.languageSwitcher.changeTo} ${localeNames[locale]}`,
  }));
}

export function getSectionParams(): Array<{ lang: Locale; section: string }> {
  return locales.flatMap((lang) =>
    Object.values(routeSegments[lang]).map((section) => ({ lang, section })),
  );
}

export function getProjectParams(slugs: readonly string[]) {
  return locales.flatMap((lang) =>
    slugs.map((slug) => ({
      lang,
      section: routeSegments[lang].projects,
      slug,
    })),
  );
}

export function localizePath(path: string, targetLocale: Locale): string {
  const [pathname, hash = ""] = path.split("#", 2);
  const segments = pathname.split("/").filter(Boolean);
  const sourceLocale = segments[0];

  if (!sourceLocale || !isLocale(sourceLocale)) {
    return `${getPath(targetLocale, "home")}${hash ? `#${hash}` : ""}`;
  }

  if (segments.length === 1) {
    return `${getPath(targetLocale, "home")}${hash ? `#${hash}` : ""}`;
  }

  const sourceRoute = getRouteForSection(sourceLocale, segments[1] ?? "");
  if (!sourceRoute) return getPath(targetLocale, "home");
  const slug = sourceRoute === "projects" ? segments[2] : undefined;
  return `${getPath(targetLocale, sourceRoute, slug)}${hash ? `#${hash}` : ""}`;
}
