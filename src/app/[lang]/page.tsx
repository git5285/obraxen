import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanySection } from "@/components/company-section";
import { FaqSection } from "@/components/faq-section";
import { HeroSection } from "@/components/hero-section";
import { IntroSection } from "@/components/intro-section";
import { ProcessSection } from "@/components/process-section";
import { ProjectsSection } from "@/components/projects-section";
import { ServicesSection } from "@/components/services-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavigation } from "@/components/site-navigation";
import { brand, getBrandTranslation } from "@/lib/brand";
import { getHomepage, getHomepageJsonLd } from "@/lib/homepage";
import {
  getLanguageLinks,
  getLocalizedPaths,
  getPath,
  isLocale,
  openGraphLocales,
} from "@/lib/i18n";

type HomePageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const homepage = getHomepage(lang);
  const title = brand.nombre ? `${brand.nombre} — ${homepage.claim}` : homepage.claim;
  const images = brand.dominio ? [{
    url: homepage.heroImage.src,
    width: homepage.heroImage.width,
    height: homepage.heroImage.height,
    alt: homepage.dictionary.meta.heroImageAlt,
  }] : [];
  return {
    title,
    description: homepage.dictionary.meta.homeDescription,
    alternates: brand.dominio ? {
      canonical: getPath(lang, "home"),
      languages: getLocalizedPaths("home"),
    } : undefined,
    openGraph: {
      title,
      description: homepage.dictionary.meta.homeDescription,
      type: "website",
      locale: openGraphLocales[lang],
      siteName: brand.nombre ?? getBrandTranslation(lang).claim,
      url: brand.dominio ? getPath(lang, "home") : undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: homepage.dictionary.meta.homeDescription,
      images: images.map(({ url }) => url),
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const homepage = getHomepage(lang);
  const { dictionary } = homepage;
  const homeHref = getPath(lang, "home");
  const languageLinks = getLanguageLinks(lang, "home");

  return (
    <SiteNavigation
      brandName={homepage.brandName}
      cta={homepage.cta}
      items={homepage.navigationItems}
      labels={dictionary.common}
      languageLabel={dictionary.languageSwitcher.label}
      languageLinks={languageLinks}
      homeHref={homeHref}
    >
      <a className="skip" href="#content">{dictionary.common.skipToContent}</a>
      <HeroSection
        brandName={homepage.brandName}
        cta={homepage.cta}
        image={homepage.heroImage}
        navigation={homepage.navigationItems}
        copy={dictionary.hero}
        labels={dictionary.common}
        languageLabel={dictionary.languageSwitcher.label}
        languageLinks={languageLinks}
        homeHref={homeHref}
      />
      <main id="content">
        <IntroSection kicker={homepage.brandKicker} stats={homepage.stats} copy={dictionary.intro} />
        <ProcessSection copy={dictionary.process} />
        <ServicesSection cta={homepage.cta} copy={dictionary.services} services={homepage.services} />
        <ProjectsSection locale={lang} />
        <CompanySection
          cta={homepage.cta}
          image={homepage.diagnosticoImage}
          kicker={homepage.whyKicker}
          hasOwnTeams={homepage.hasOwnTeams}
          priorityMarketsLabel={homepage.priorityMarketsLabel}
          copy={dictionary.company}
        />
        <FaqSection copy={dictionary.faq} />
      </main>
      <SiteFooter
        brandName={homepage.brandName}
        serviceAreaLabel={homepage.serviceAreaLabel}
        priorityMarketsLabel={homepage.priorityMarketsLabel}
        hasContactChannel={homepage.hasContactChannel}
        contactHref={getPath(lang, "contact")}
        homeHref={homeHref}
        navigation={homepage.navigationItems}
        languageLabel={dictionary.languageSwitcher.label}
        languageLinks={languageLinks}
        copy={dictionary.footer}
        common={dictionary.common}
        contactCopy={dictionary.contact}
        contact={homepage.contact}
        legal={homepage.legal}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: getHomepageJsonLd(lang) }}
      />
    </SiteNavigation>
  );
}
