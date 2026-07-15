import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { ContactUnavailable } from "@/components/contact-unavailable";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalPage, legalFacts } from "@/components/legal-page";
import { LogoMark } from "@/components/logo-mark";
import { ProjectCard } from "@/components/project-card";
import { ProjectFooter } from "@/components/project-footer";
import { ProjectHeader } from "@/components/project-header";
import { ProjectJsonLd } from "@/components/project-json-ld";
import { brand, getBrandTranslation } from "@/lib/brand";
import { resolveContactConfig } from "@/lib/contact";
import {
  getDictionary,
  getLanguageLinks,
  getPath,
  getRouteForSection,
  getSectionParams,
  isLocale,
  openGraphLocales,
  type Locale,
  type RouteKey,
} from "@/lib/i18n";
import { absoluteSiteUrl, getLocalizedAlternates } from "@/lib/metadata";
import { getProjectsJsonLd, getProjectsMetadata } from "@/lib/project-pages";
import { projects } from "@/lib/projects";
import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY } from "@/lib/consent";

type SectionPageProps = { params: Promise<{ lang: string; section: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getSectionParams();
}

export function getSectionMetadata(
  locale: Locale,
  route: RouteKey,
  domain = brand.dominio,
): Metadata {
  const dictionary = getDictionary(locale);
  const claim = getBrandTranslation(locale).claim;
  const document = route === "legalNotice"
    ? dictionary.legal.notice
    : route === "privacy"
      ? dictionary.legal.privacy
      : route === "cookies"
        ? dictionary.legal.cookies
        : null;
  const title = document?.title ?? dictionary.meta.contactTitle;
  const description = document?.description ?? dictionary.meta.contactDescription;
  return {
    title: `${title} — ${claim}`,
    description,
    alternates: getLocalizedAlternates(domain, locale, route),
    openGraph: {
      title: `${title} — ${claim}`,
      description,
      type: "website",
      locale: openGraphLocales[locale],
      siteName: brand.nombre ?? claim,
      url: domain ? absoluteSiteUrl(domain, getPath(locale, route)) : undefined,
    },
  };
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { lang, section } = await params;
  if (!isLocale(lang)) return {};
  const route = getRouteForSection(lang, section);
  if (!route) return {};
  return route === "projects" ? getProjectsMetadata(lang) : getSectionMetadata(lang, route);
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { lang, section } = await params;
  if (!isLocale(lang)) notFound();
  const route = getRouteForSection(lang, section);
  if (!route || route === "home") notFound();
  const dictionary = getDictionary(lang);

  if (route === "projects") {
    return (
      <>
        <a className="skip" href="#projects-content">{dictionary.common.skipToContent}</a>
        <ProjectHeader variant="projects" locale={lang} />
        <main id="projects-content">
          <section className="projects-hero" aria-labelledby="projects-title">
            <div className="projects-wrap">
              <nav className="breadcrumbs" aria-label={dictionary.common.breadcrumbs}>
                <ol>
                  <li><a href={getPath(lang, "home")}>{dictionary.common.home}</a></li>
                  <li aria-current="page">{dictionary.common.projects}</li>
                </ol>
              </nav>
              <div className="projects-hero-grid">
                <div>
                  <p className="projects-kicker">{dictionary.projectHub.kicker}</p>
                  <h1 id="projects-title">{dictionary.projectHub.title}</h1>
                </div>
                <div className="projects-hero-copy">
                  <p>{dictionary.projectHub.intro}</p>
                  <p className="archive-note"><strong>{dictionary.projectHub.archiveNote.replace("{count}", String(projects.length))}</strong></p>
                </div>
              </div>
            </div>
          </section>
          <section className="projects-archive" aria-label={dictionary.projectHub.archiveAria}>
            <div className="projects-wrap">
              {projects.map((project) => <ProjectCard key={project.slug} project={project} locale={lang} />)}
            </div>
          </section>
        </main>
        <ProjectFooter variant="projects" locale={lang} />
        <ProjectJsonLd value={getProjectsJsonLd(lang)} />
      </>
    );
  }

  if (route === "legalNotice" || route === "privacy" || route === "cookies") {
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
        locale={lang}
        route={route}
        document={document}
        facts={legalFacts(dictionary, route, storage)}
      />
    );
  }

  if (route === "contact") {
    const enabled = resolveContactConfig(process.env).enabled;
    return (
      <div className="legal-shell">
        <nav className="legal-nav contact-nav" aria-label={dictionary.common.mainNavigation}>
          <div>
            <LogoMark brandName={brand.nombre} href={getPath(lang, "home")} homeLabel={dictionary.common.home} />
            <LanguageSwitcher label={dictionary.languageSwitcher.label} links={getLanguageLinks(lang, "contact")} />
            <a className="volver" href={getPath(lang, "home")}>{dictionary.legal.backToSite}</a>
          </div>
        </nav>
        <main className="contact-page" id="contact-content">
          <p className="kicker">{dictionary.contact.kicker}</p>
          <h1>{dictionary.contact.title}</h1>
          <p className="contact-intro">{dictionary.contact.intro}</p>
          {enabled ? (
            <ContactForm
              locale={lang}
              copy={dictionary.contact}
              privacyUrl={getPath(lang, "privacy")}
            />
          ) : (
            <ContactUnavailable
              copy={dictionary.contact}
              projectsUrl={getPath(lang, "projects")}
            />
          )}
        </main>
      </div>
    );
  }

  notFound();
}
