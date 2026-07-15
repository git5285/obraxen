import { brand, getBrandTranslation } from "@/lib/brand";
import type { Dictionary, LegalDocumentCopy } from "@/lib/dictionaries/types";
import {
  getDictionary,
  getLanguageLinks,
  getPath,
  type Locale,
  type RouteKey,
} from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

type LegalPageProps = {
  locale: Locale;
  route: "legalNotice" | "privacy" | "cookies";
  document: LegalDocumentCopy;
  facts?: readonly { label: string; value: string | null }[];
};

export function LegalPage({ locale, route, document, facts = [] }: LegalPageProps) {
  const dictionary = getDictionary(locale);
  const legal = dictionary.legal;
  return (
    <div className="legal-shell">
      <nav className="legal-nav" aria-label={legal.navigationAria}>
        <div>
          <a href={getPath(locale, "home")}>{getBrandTranslation(locale).claim}</a>
          <LanguageSwitcher
            label={dictionary.languageSwitcher.label}
            links={getLanguageLinks(locale, route)}
          />
          <a className="volver" href={getPath(locale, "home")}>{legal.backToSite}</a>
        </div>
      </nav>
      <main>
        <p className="estado">{legal.draftStatus}</p>
        <h1>{document.title}</h1>
        <p className="intro">{document.intro}</p>

        {facts.length ? (
          <div className="ficha">
            <dl>
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value ?? dictionary.common.noData}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="alerta">
          <strong>{document.alertTitle}</strong>
          {document.alertText}
        </div>

        {document.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets?.length ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item.label}><strong>{item.label}</strong> {item.text}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <footer>
          {legal.lastReview} ·{" "}
          <a href={getPath(locale, document.relatedRoute as RouteKey)}>{document.relatedLabel}</a>
          {brand.formularioProveedor && route === "privacy" ? (
            <> · <a href="https://resend.com/legal/dpa" rel="noopener">Resend DPA</a></>
          ) : null}
        </footer>
      </main>
    </div>
  );
}

export function legalFacts(
  dictionary: Dictionary,
  route: "legalNotice" | "privacy" | "cookies",
  storage?: { key: string; days: number },
) {
  const labels = dictionary.legal.factLabels;
  if (route === "legalNotice") {
    return [
      { label: labels.owner, value: brand.nombreLegal },
      { label: labels.taxId, value: brand.cif },
      { label: labels.address, value: brand.direccion },
      { label: labels.email, value: brand.email },
      { label: labels.domain, value: brand.dominio },
      { label: labels.register, value: null },
    ];
  }
  if (route === "privacy") {
    return [
      { label: labels.controller, value: brand.nombreLegal },
      { label: labels.taxId, value: brand.cif },
      { label: labels.address, value: brand.direccion },
      { label: labels.privacyContact, value: brand.emailPrivacidad },
    ];
  }
  return [
    { label: labels.controller, value: brand.nombreLegal },
    { label: labels.key, value: storage?.key ?? null },
    { label: labels.origin, value: labels.firstParty },
    { label: labels.duration, value: storage ? `${storage.days} ${labels.days}` : null },
    { label: labels.purpose, value: labels.preferencePurpose },
  ];
}
