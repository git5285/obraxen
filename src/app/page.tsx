import { CompanySection } from "@/components/company-section";
import { FaqSection } from "@/components/faq-section";
import { HeroSection } from "@/components/hero-section";
import { IntroSection } from "@/components/intro-section";
import { ProcessSection } from "@/components/process-section";
import { ProjectsSection } from "@/components/projects-section";
import { ServicesSection } from "@/components/services-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavigation } from "@/components/site-navigation";
import { brand } from "@/lib/brand";
import { homepage, homepageJsonLd, navigationItems } from "@/lib/homepage";

const homeTitle = brand.nombre ? `${brand.nombre} — ${brand.claim}` : brand.claim;
const homeDescription =
  "Reparación de pavimentos industriales: juntas, fisuras, recrecidos y tratamientos superficiales. Intervenciones planificadas para reducir el impacto en la actividad.";
const homeImages = brand.dominio
  ? [{
      url: homepage.heroImage.src,
      width: homepage.heroImage.width,
      height: homepage.heroImage.height,
      alt: "Pavimento de una instalación industrial",
    }]
  : [];

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: brand.dominio ? { canonical: "/" } : undefined,
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    type: "website",
    locale: "es_ES",
    siteName: brand.nombre ?? brand.claim,
    url: brand.dominio ? "/" : undefined,
    images: homeImages,
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: homeImages.map(({ url }) => url),
  },
};

export default function HomePage() {
  return (
    <SiteNavigation
      brandName={homepage.brandName}
      cta={homepage.cta}
      items={navigationItems}
    >
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <HeroSection
        brandName={homepage.brandName}
        cta={homepage.cta}
        image={homepage.heroImage}
        navigation={navigationItems}
      />
      <main id="contenido">
        <IntroSection kicker={homepage.brandKicker} stats={homepage.stats} />
        <ProcessSection />
        <ServicesSection cta={homepage.cta} />
        <ProjectsSection />
        <CompanySection
          cta={homepage.cta}
          image={homepage.diagnosticoImage}
          kicker={homepage.whyKicker}
          hasOwnTeams={homepage.hasOwnTeams}
          priorityMarketsLabel={homepage.priorityMarketsLabel}
        />
        <FaqSection />
      </main>
      <SiteFooter
        brandName={homepage.brandName}
        serviceAreaLabel={homepage.serviceAreaLabel}
        priorityMarketsLabel={homepage.priorityMarketsLabel}
        hasContactChannel={homepage.hasContactChannel}
        contact={homepage.contact}
        legal={homepage.legal}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: homepageJsonLd }}
      />
    </SiteNavigation>
  );
}
import type { Metadata } from "next";
