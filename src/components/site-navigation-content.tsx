import type { NavigationItem } from "@/lib/homepage";
import type { Dictionary } from "@/lib/dictionaries/types";
import { CtaLink } from "./cta-link";
import { LanguageSwitcher, type LanguageLink } from "./language-switcher";
import { LogoMark } from "./logo-mark";
import { MenuButton } from "./menu-button";

type MobileNavigationContentProps = {
  items: readonly NavigationItem[];
  cta: { href: string; text: string };
  languageLabel: string;
  languageLinks: readonly LanguageLink[];
};

export function MobileNavigationContent({
  items,
  cta,
  languageLabel,
  languageLinks,
}: MobileNavigationContentProps) {
  return (
    <>
      {items.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
      <LanguageSwitcher label={languageLabel} links={languageLinks} />
      <CtaLink href={cta.href} eventLocation="mobile-menu">{cta.text}</CtaLink>
    </>
  );
}

type StickyNavigationContentProps = {
  brandName: string | null;
  cta: { href: string; text: string };
  items: readonly NavigationItem[];
  labels: Pick<Dictionary["common"], "home" | "menuOpen">;
  languageLabel: string;
  languageLinks: readonly LanguageLink[];
  homeHref: string;
};

export function StickyNavigationContent({
  brandName,
  cta,
  items,
  labels,
  languageLabel,
  languageLinks,
  homeHref,
}: StickyNavigationContentProps) {
  return (
    <>
      <LogoMark brandName={brandName} href={homeHref} homeLabel={labels.home} />
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              data-navigation-section={item.section}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <LanguageSwitcher label={languageLabel} links={languageLinks} />
      <MenuButton label={labels.menuOpen} />
      <CtaLink href={cta.href} eventLocation="sticky-navigation">{cta.text}</CtaLink>
    </>
  );
}
