import type { Locale } from "@/lib/i18n";

export type LanguageLink = {
  locale: Locale;
  name: string;
  href: string;
  current: boolean;
  ariaLabel: string;
};

export function LanguageSwitcher({
  label,
  links,
}: {
  label: string;
  links: readonly LanguageLink[];
}) {
  return (
    <nav className="language-switcher" aria-label={label}>
      <ul>
        {links.map((link) => (
          <li key={link.locale}>
            <a
              href={link.href}
              hrefLang={link.locale}
              lang={link.locale}
              aria-current={link.current ? "page" : undefined}
              aria-label={link.ariaLabel}
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
