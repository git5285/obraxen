import {
  getLocalizedPaths,
  getPath,
  type Locale,
  type RouteKey,
} from "./i18n";

export function absoluteSiteUrl(domain: string, path: string): string {
  return new URL(path, `https://${domain}`).toString();
}

export function getLocalizedAlternates(
  domain: string | null,
  locale: Locale,
  route: RouteKey,
  slug?: string,
) {
  if (!domain) return undefined;
  return {
    canonical: absoluteSiteUrl(domain, getPath(locale, route, slug)),
    languages: Object.fromEntries(
      Object.entries(getLocalizedPaths(route, slug)).map(([language, path]) => [
        language,
        absoluteSiteUrl(domain, path),
      ]),
    ),
  };
}
