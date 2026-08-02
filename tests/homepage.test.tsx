import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const contactMock = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/contact", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/contact")>();
  return {
    ...actual,
    resolveContactConfig: () => contactMock.enabled
      ? {
          enabled: true,
          apiKey: `re_${"1".repeat(30)}`,
          toEmail: "info@obraxen.com",
          fromEmail: "web@obraxen.com",
          rateLimitMode: "vercel-waf",
          issues: [],
        }
      : {
          enabled: false,
          apiKey: null,
          toEmail: null,
          fromEmail: null,
          rateLimitMode: null,
          issues: ["disabled"],
        },
  };
});

import HomePage, { generateMetadata, getHomeMetadata } from "@/app/[lang]/page";
import { brand } from "@/lib/brand";
import { getHomepage } from "@/lib/homepage";
import { getDictionary, getPath, locales } from "@/lib/i18n";
import { projects } from "@/lib/projects";

afterEach(() => {
  contactMock.enabled = false;
});

describe("localized Next.js homepage", () => {
  it.each(locales)("renders the complete %s homepage without mixed project content", async (locale) => {
    const dictionary = getDictionary(locale);
    const html = renderToStaticMarkup(
      await HomePage({ params: Promise.resolve({ lang: locale }) }),
    ).replaceAll("&#x27;", "'");
    expect(html).toContain(dictionary.hero.title);
    expect(html).toContain(dictionary.intro.methodWords[0]);
    expect(html).toContain(dictionary.projectsSection.title);
    expect(html).toContain(dictionary.faq.title);
    expect(html.match(/<article class="proy">/g)).toHaveLength(projects.length);
    for (const project of projects) expect(html).toContain(project.traducciones[locale].titulo);
    expect(html).toContain(`href="${getPath(locale, "cookies")}"`);
    expect(html).not.toContain("style=");
    if (brand.nombreTemporalNoPublicable) expect(html).not.toContain(brand.nombreTemporalNoPublicable);
  });

  it.each(locales)("uses projects while the contact form is unavailable on the %s homepage", async (locale) => {
    contactMock.enabled = false;
    const dictionary = getDictionary(locale);
    expect(getHomepage(locale).cta).toEqual({
      href: getPath(locale, "projects"),
      text: dictionary.cta.projects,
    });
    expect(getHomepage(locale).contactFormEnabled).toBe(false);
    const html = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: locale }) }));
    expect(html).not.toContain('class="cta-fila"');
    expect(html).toContain('href="mailto:info@obraxen.com"');
  });

  it.each(locales)("uses assessment when the contact form is enabled on the %s homepage", async (locale) => {
    contactMock.enabled = true;
    const dictionary = getDictionary(locale);
    expect(getHomepage(locale).cta).toEqual({
      href: getPath(locale, "contact"),
      text: dictionary.cta.assessment,
    });
    expect(getHomepage(locale).contactFormEnabled).toBe(true);
    const html = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: locale }) }));
    expect(html).toContain('class="cta-fila"');
    expect(html).toContain('href="mailto:info@obraxen.com"');
  });

  it.each(locales)("keeps visible project text inside accessible names in %s", async (locale) => {
    const dictionary = getDictionary(locale);
    const html = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: locale }) }));
    expect(html.match(new RegExp(`>${dictionary.projectsSection.openCase} <span aria-hidden="true">`, "g")))
      .toHaveLength(projects.length);
    for (const project of projects) {
      expect(html).toContain(`aria-label="${dictionary.projectsSection.openCaseAria} ${project.cliente}"`);
    }
  });

  it.each(locales)("provides %s social metadata for the verified domain", async (locale) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: locale }) });
    expect(metadata.openGraph).toMatchObject({ type: "website" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.alternates).toMatchObject({
      canonical: `https://obraxen.com/${locale}/`,
      languages: { "x-default": "https://obraxen.com/en/" },
    });
    expect(metadata.openGraph).toMatchObject({ url: `https://obraxen.com/${locale}/` });
    expect(metadata.openGraph && "images" in metadata.openGraph
      ? metadata.openGraph.images
      : undefined).toHaveLength(1);
  });

  it.each(locales)("provides absolute %s candidate metadata with an injected domain", (locale) => {
    const metadata = getHomeMetadata(locale, "example.com");
    expect(metadata.alternates).toMatchObject({
      canonical: `https://example.com/${locale}/`,
      languages: { "x-default": "https://example.com/en/" },
    });
    expect(metadata.openGraph).toMatchObject({ url: `https://example.com/${locale}/` });
  });
});
