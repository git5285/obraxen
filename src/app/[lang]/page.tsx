import type { Metadata } from "next";
import { notFound } from "next/navigation";
import delticomInitial from "../../../img/proyectos/delticom/estado-inicial.webp";
import delticomResult from "../../../img/proyectos/delticom/resultado.webp";
import hologramInitial from "../../../img/proyectos/hologram/estado-inicial-huecos.webp";
import hologramResult from "../../../img/proyectos/hologram/resultado.webp";
import "../../../css/architecture.css";
import { ArchitectureHome } from "@/components/architecture-home";
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
  getPath,
  isLocale,
  openGraphLocales,
  type Locale,
} from "@/lib/i18n";
import { absoluteSiteUrl, getLocalizedAlternates } from "@/lib/metadata";
import { internalProjects } from "@/lib/internal-projects";

type HomePageProps = { params: Promise<{ lang: string }> };

const architectureProjectImages = {
  "delticom-hannover": { initial: delticomInitial, result: delticomResult },
  "hologram-paris": { initial: hologramInitial, result: hologramResult },
};

function getArchitectureDefaultMetadata(domain = brand.dominio): Metadata {
  const path = getPath("es", "home");
  const url = domain ? absoluteSiteUrl(domain, path) : undefined;
  const image = domain ? absoluteSiteUrl(domain, "/img/architecture-hall-illustrative.png") : undefined;
  return {
    title: "Obraxen | Reparación de pavimentos industriales",
    description: "Reparación y rehabilitación de pavimentos industriales.",
    alternates: getLocalizedAlternates(domain, "es", "home"),
    openGraph: {
      title: "Obraxen | Reparación de pavimentos industriales",
      description: "Reparación y rehabilitación de pavimentos industriales.",
      type: "website",
      locale: openGraphLocales.es,
      siteName: brand.nombre ?? "Obraxen",
      url,
      ...(image ? { images: [{ url: image, alt: "Reparación de pavimentos industriales" }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: "Obraxen | Reparación de pavimentos industriales",
      description: "Reparación y rehabilitación de pavimentos industriales.",
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function getHomeMetadata(lang: Locale, domain = brand.dominio): Metadata {
  const homepage = getHomepage(lang);
  const title = brand.nombre ? `${brand.nombre} — ${homepage.claim}` : homepage.claim;
  const images = domain ? [{
    url: absoluteSiteUrl(domain, homepage.heroImage.src),
    width: homepage.heroImage.width,
    height: homepage.heroImage.height,
    alt: homepage.dictionary.meta.heroImageAlt,
  }] : [];
  return {
    title,
    description: homepage.dictionary.meta.homeDescription,
    alternates: getLocalizedAlternates(domain, lang, "home"),
    openGraph: {
      title,
      description: homepage.dictionary.meta.homeDescription,
      type: "website",
      locale: openGraphLocales[lang],
      siteName: brand.nombre ?? getBrandTranslation(lang).claim,
      url: domain ? absoluteSiteUrl(domain, getPath(lang, "home")) : undefined,
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

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  if (lang === "es") return getArchitectureDefaultMetadata();
  return isLocale(lang) ? getHomeMetadata(lang) : {};
}

function getArchitectureProjects() {
  return ["delticom-hannover", "hologram-paris"].map((slug) => {
    const project = internalProjects.find((item) => item.slug === slug);
    if (!project) throw new Error(`Falta el registro interno ${slug}`);
    const images = ["Estado inicial", "Resultado documentado"].map((stage) => {
      const image = project.imagenes.find((item) => item.etapa === stage);
      if (!image) throw new Error(`Falta la fotografía ${stage} de ${slug}`);
      const asset = architectureProjectImages[slug as keyof typeof architectureProjectImages][stage === "Estado inicial" ? "initial" : "result"];
      return {
        src: asset.src,
        alt: image.alt,
        stage,
        width: asset.width,
        height: asset.height,
      };
    });
    return {
      name: project.cliente,
      city: project.ubicacion.ciudad,
      country: project.traducciones.es.pais,
      sector: project.traducciones.es.sector,
      area: project.superficieM2,
      description: project.traducciones.es.solucion,
      problem: project.traducciones.es.problema,
      result: project.traducciones.es.resultado,
      duration: project.traducciones.es.duracionReal,
      materials: project.traducciones.es.materiales,
      images,
    };
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  if (lang === "es") return <ArchitectureHome projects={getArchitectureProjects()} />;
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
        <ServicesSection cta={{ href: "#contact", text: dictionary.footer.contact }} copy={dictionary.services} services={homepage.services} />
        <ProcessSection copy={dictionary.process} />
        <ProjectsSection locale={lang} />
        <CompanySection
          cta={{ href: "#contact", text: dictionary.footer.contact }}
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
        contactFormEnabled={homepage.contactFormEnabled}
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
