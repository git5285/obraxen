import { renderToStaticMarkup } from "react-dom/server";
import Link from "next/link";
import { beforeEach, expect, it, vi } from "vitest";
import NotFound from "@/app/not-found";
import GlobalNotFound, { generateMetadata as globalMetadata } from "@/app/global-not-found";
import LocaleNotFound, { generateMetadata as localeMetadata } from "@/app/[lang]/not-found";
import { defaultLocale, getDictionary, getPath, locales, type Locale } from "@/lib/i18n";
import styles from "@/app/not-found.module.css";

const request = vi.hoisted(() => ({ locale: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(request.locale === null ? {} : { "x-obraxen-locale": request.locale }),
}));

beforeEach(() => { request.locale = null; });

// Frozen markup from the three original entries, independent of the extracted component.
function originalMain(locale: Locale, href: string) {
  const copy = getDictionary(locale).notFound;
  return renderToStaticMarkup(
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.content}>
        <p className={styles.code}>{copy.code}</p>
        <h1 className={styles.title} id="not-found-title">{copy.title}</h1>
        <p className={styles.body}>{copy.body}</p>
        <Link className={styles.link} href={href}>
          {copy.link} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>,
  );
}

it("preserves the root fallback including its fixed English link", () => {
  expect(renderToStaticMarkup(<NotFound />)).toBe(originalMain(defaultLocale, "/en/"));
});

it.each([...locales, null, "unsupported"])("preserves global and localized entries for header %s", async (header) => {
  request.locale = header;
  const locale = locales.includes(header as Locale) ? header as Locale : defaultLocale;
  const copy = getDictionary(locale).notFound;
  const expectedMain = originalMain(locale, getPath(locale, "home"));
  const global = renderToStaticMarkup(await GlobalNotFound());
  const localized = renderToStaticMarkup(await LocaleNotFound());
  expect(global.match(/<main[\s\S]*?<\/main>/)?.[0]).toBe(expectedMain);
  expect(localized.match(/<main[\s\S]*?<\/main>/)?.[0]).toBe(expectedMain);
  expect(global).toContain(`<html lang="${locale}">`);
  expect(global).toContain("<body>");
  expect(localized).toContain(`<title>${copy.code}</title>`);
  expect(await globalMetadata()).toEqual({ title: copy.code, description: copy.body });
  expect(await localeMetadata()).toEqual({ title: copy.code, description: copy.body });
});
