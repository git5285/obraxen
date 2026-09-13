import { LegalPage, legalFacts } from "@/components/legal-page";
import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY } from "@/lib/consent";
import { getDictionary, type Locale, type RouteKey } from "@/lib/i18n";

type LegalRoute = Extract<RouteKey, "legalNotice" | "privacy" | "cookies">;

type SectionLegalPageProps = {
  locale: Locale;
  route: LegalRoute;
};

export function SectionLegalPage({ locale, route }: SectionLegalPageProps) {
  const dictionary = getDictionary(locale);
  const document = route === "legalNotice"
    ? dictionary.legal.notice
    : route === "privacy"
      ? dictionary.legal.privacy
      : dictionary.legal.cookies;
  const storage = route === "cookies"
    ? { key: CONSENT_STORAGE_KEY, days: CONSENT_MAX_AGE_MS / (24 * 60 * 60 * 1000) }
    : undefined;

  return (
    <LegalPage
      locale={locale}
      route={route}
      document={document}
      facts={legalFacts(dictionary, route, storage)}
    />
  );
}
