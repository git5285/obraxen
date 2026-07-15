import { brand } from "@/lib/brand";
import {
  getDictionary,
  getLanguageLinks,
  getPath,
  type Locale,
} from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./logo-mark";

type ProjectHeaderProps = {
  variant: "projects" | "case";
  locale: Locale;
  slug?: string;
};

export function ProjectHeader({ variant, locale, slug }: ProjectHeaderProps) {
  const dictionary = getDictionary(locale);
  const isHub = variant === "projects";
  const route = "projects" as const;
  return (
    <header className={`${variant}-header`}>
      <nav
        className={`${variant}-nav`}
        aria-label={isHub
          ? dictionary.projectHub.navigationAria
          : dictionary.projectCase.navigationAria}
      >
        <LogoMark
          brandName={brand.nombre}
          href={getPath(locale, "home")}
          homeLabel={dictionary.common.home}
        />
        <LanguageSwitcher
          label={dictionary.languageSwitcher.label}
          links={getLanguageLinks(locale, route, slug)}
        />
        <a className="back-link" href={isHub ? getPath(locale, "home") : getPath(locale, "projects")}>
          {isHub ? dictionary.projectHub.backToSite : dictionary.projectCase.allProjects}{" "}
          <span aria-hidden="true">→</span>
        </a>
      </nav>
    </header>
  );
}
