import { CompanySection } from "@/components/company-section";
import { FaqSection } from "@/components/faq-section";
import { HeroSection } from "@/components/hero-section";
import { IntroSection } from "@/components/intro-section";
import { ProcessSection } from "@/components/process-section";
import { ProjectsSection } from "@/components/projects-section";
import { ServicesSection } from "@/components/services-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavigation } from "@/components/site-navigation";
import { homepage, homepageJsonLd, navigationItems } from "@/lib/homepage";

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
