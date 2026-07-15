import { brand } from "@/lib/brand";
import { getDictionary, getPath, type Locale } from "@/lib/i18n";

export function ProjectFooter({
  variant,
  locale,
}: {
  variant: "projects" | "case";
  locale: Locale;
}) {
  const copy = getDictionary(locale).footer;
  return (
    <footer className={`${variant}-footer`}>
      <div className={`${variant}-wrap`}>
        <p>{brand.nombre ? `© 2026 ${brand.nombre}. ${copy.rights}` : copy.fallbackCopyright}</p>
        <p>
          <a href={getPath(locale, "legalNotice")}>{copy.legalNotice}</a> ·{" "}
          <a href={getPath(locale, "privacy")}>{copy.privacy}</a> ·{" "}
          <a href={getPath(locale, "cookies")}>{copy.cookies}</a>
        </p>
      </div>
    </footer>
  );
}
