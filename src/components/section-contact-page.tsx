import { ContactUnavailable } from "@/components/contact-unavailable";
import { ContactRuntimeGate } from "@/components/contact-runtime-gate";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoMark } from "@/components/logo-mark";
import { brand } from "@/lib/brand";
import { getDictionary, getLanguageLinks, getPath, type Locale } from "@/lib/i18n";
import { resolveRuntimeConfig } from "@/lib/runtime-config";

type SectionContactPageProps = {
  locale: Locale;
};

export function SectionContactPage({ locale }: SectionContactPageProps) {
  const dictionary = getDictionary(locale);
  const initialEnabled = resolveRuntimeConfig().contact.enabled;

  return (
    <div className="legal-shell">
      <a className="skip" href="#contact-content">{dictionary.common.skipToContent}</a>
      <nav className="legal-nav contact-nav" aria-label={dictionary.common.mainNavigation}>
        <div>
          <LogoMark brandName={brand.nombre} href={getPath(locale, "home")} homeLabel={dictionary.common.home} />
          <LanguageSwitcher label={dictionary.languageSwitcher.label} links={getLanguageLinks(locale, "contact")} />
          <a className="volver" href={getPath(locale, "home")}>{dictionary.legal.backToSite}</a>
        </div>
      </nav>
      <main className="contact-page" id="contact-content">
        <p className="kicker">{dictionary.contact.kicker}</p>
        <h1>{dictionary.contact.title}</h1>
        <p className="contact-intro">{dictionary.contact.intro}</p>
        <ContactRuntimeGate
          initialEnabled={initialEnabled}
          locale={locale}
          copy={dictionary.contact}
          privacyUrl={getPath(locale, "privacy")}
          unavailable={(
            <ContactUnavailable
              copy={dictionary.contact}
              projectsUrl={getPath(locale, "projects")}
            />
          )}
        />
      </main>
    </div>
  );
}
