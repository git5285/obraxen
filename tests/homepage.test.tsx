import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage, { generateMetadata, getHomeMetadata } from "@/app/[lang]/page";
import { brand } from "@/lib/brand";
import { getDictionary, getPath, locales } from "@/lib/i18n";
import { projects } from "@/lib/projects";

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

  it.each(locales)("keeps unavailable contact flows out of the %s homepage", async (locale) => {
    const dictionary = getDictionary(locale);
    const html = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: locale }) }));
    expect(html).not.toContain(dictionary.cta.assessment);
    expect(html).toContain(dictionary.cta.projects);
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

  it.each(locales)("provides %s social metadata without inventing a domain", async (locale) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: locale }) });
    expect(metadata.openGraph).toMatchObject({ type: "website" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph && "images" in metadata.openGraph
      ? metadata.openGraph.images
      : undefined).toEqual([]);
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
