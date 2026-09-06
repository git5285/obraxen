import type { StaticImageData } from "next/image";
import type { NavigationItem } from "@/lib/homepage";
import { getImageDimensions } from "@/lib/homepage";
import type { Dictionary } from "@/lib/dictionaries/types";
import { CtaLink } from "./cta-link";
import { LanguageSwitcher, type LanguageLink } from "./language-switcher";
import { LogoMark } from "./logo-mark";
import { ResponsiveImage } from "./responsive-image";
import { MenuButton } from "./site-navigation";

type HeroSectionProps = {
  brandName: string | null;
  cta: { href: string; text: string };
  image: StaticImageData;
  navigation: readonly NavigationItem[];
  copy: Dictionary["hero"];
  labels: Dictionary["common"];
  languageLabel: string;
  languageLinks: readonly LanguageLink[];
  homeHref: string;
};

export function HeroSection({
  brandName,
  cta,
  image,
  navigation,
  copy,
  labels,
  languageLabel,
  languageLinks,
  homeHref,
}: HeroSectionProps) {
  const dimensions = getImageDimensions(image, { width: 1280, height: 720 });
  return (
    <section className="hero" id="inicio">
      <nav className="hero-nav" aria-label={labels.mainNavigation}>
        <LogoMark brandName={brandName} href={homeHref} homeLabel={labels.home} />
        <ul>
          {navigation.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
        <LanguageSwitcher label={languageLabel} links={languageLinks} />
        <MenuButton label={labels.menuOpen} />
        <CtaLink href={cta.href} eventLocation="hero-navigation">{cta.text}</CtaLink>
      </nav>
      <div className="hero-scene">
        <ResponsiveImage
          className="hero-bg"
          src={image}
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          priority
          unoptimized
          sizes="100vw"
        />
        <div className="hero-body">
        <div>
          <p className="kicker kicker-hero">{brandName}</p>
          <h1>{copy.title}</h1>
        </div>
        </div>
      </div>
      <div className="hero-summary wrap">
        <p className="hero-sub">{copy.body}</p>
        <CtaLink href={cta.href} eventLocation="hero">{cta.text}</CtaLink>
      </div>
    </section>
  );
}
