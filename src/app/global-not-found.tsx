import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { defaultLocale, getDictionary, getPath, isLocale } from "@/lib/i18n";
import styles from "./not-found.module.css";
import "./globals.css";

async function getNotFoundLocale() {
  const localeHeader = (await headers()).get("x-obraxen-locale");
  return localeHeader && isLocale(localeHeader) ? localeHeader : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getNotFoundLocale();
  const copy = getDictionary(locale).notFound;
  return { title: copy.code, description: copy.body };
}

export default async function GlobalNotFound() {
  const locale = await getNotFoundLocale();
  const copy = getDictionary(locale).notFound;

  return (
    <html lang={locale}>
      <body>
        <main className={styles.page} aria-labelledby="not-found-title">
          <div className={styles.content}>
            <p className={styles.code}>{copy.code}</p>
            <h1 className={styles.title} id="not-found-title">{copy.title}</h1>
            <p className={styles.body}>{copy.body}</p>
            <Link className={styles.link} href={getPath(locale, "home")}>
              {copy.link} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
