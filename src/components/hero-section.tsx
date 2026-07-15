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
      <div className="hero-body">
        <div>
          <p className="kicker kicker-hero">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p className="hero-sub">{copy.body}</p>
          <span className="inline-block">
            <CtaLink href={cta.href} eventLocation="hero">{cta.text}</CtaLink>
          </span>
        </div>
      </div>
      <div className="fisura-wrap" aria-hidden="true">
        <svg className="fisura" viewBox="0 0 1200 56" preserveAspectRatio="none">
          <path
            className="f-rota"
            d="M0,28 L70,22 L130,34 L200,18 L260,36 L330,24 L400,32 L470,20 L540,34 L610,26 L680,33 L750,21 L820,31 L890,24 L960,32 L1030,25 L1100,30 L1200,28"
          />
          <path className="f-fija" d="M0,28 L1200,28" />
        </svg>
        <div className="fisura-label">
          <span>{copy.crackBefore}</span>
          <span>{copy.crackAfter}</span>
        </div>
      </div>
    </section>
  );
}
