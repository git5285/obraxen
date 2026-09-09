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
import { getHomepage, getProjectImage } from "@/lib/homepage";
import { getDictionary, getPath, locales } from "@/lib/i18n";
import { internalProjects } from "@/lib/internal-projects";
import { publicProjects } from "@/lib/projects";

const legacyLocales = locales.filter((locale) => locale !== "es");

afterEach(() => {
  contactMock.enabled = false;
});

describe("localized Next.js homepage", () => {
  it.each(legacyLocales)("renders only authorized project content on the %s legacy homepage", async (locale) => {
    const dictionary = getDictionary(locale);
    const html = renderToStaticMarkup(
      await HomePage({ params: Promise.resolve({ lang: locale }) }),
    ).replaceAll("&#x27;", "'");
    expect(html).toContain(dictionary.hero.title);
    expect(html).toContain(dictionary.intro.methodWords[0]);
    expect(html).not.toContain(dictionary.projectsSection.title);
    expect(html).toContain(dictionary.faq.title);
    expect(html.match(/<article class="proy">/g) ?? []).toHaveLength(publicProjects.length);
    for (const project of publicProjects) expect(html).toContain(project.traducciones[locale].titulo);
    for (const project of internalProjects.filter((item) => !publicProjects.includes(item))) {
      expect(html).not.toContain(project.cliente);
      expect(html).not.toContain(project.slug);
    }
    expect(html).toContain(`href="${getPath(locale, "cookies")}"`);
    expect(html).not.toContain("style=");
    if (brand.nombreTemporalNoPublicable) expect(html).not.toContain(brand.nombreTemporalNoPublicable);
  });

  it.each([
    {
      locale: "de" as const,
      title: "Betonsanierung nach Schadensbild, Verkehr und Nutzung",
      condition: "Je nach Befund kann sie lokale Betonsanierung, Vorbereitung, Ausgleich oder Betonschleifen und -polieren umfassen.",
      service: "Betonschleifen und -polieren",
    },
    {
      locale: "en" as const,
      title: "Concrete refurbishment shaped by damage, traffic and use",
      condition: "Depending on the diagnosis, it may combine local concrete repair, preparation, levelling, or concrete grinding and polishing.",
      service: "Concrete grinding and polishing",
    },
  ])("keeps conditional concrete refurbishment clear in $locale services", async ({ locale, title, condition, service }) => {
    const dictionary = getDictionary(locale);
    const html = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: locale }) }));

    expect(dictionary.services.title).toBe(title);
    expect(dictionary.services.intro).toContain(condition);
    expect(dictionary.services.items.map(({ title: itemTitle }) => itemTitle)).toContain(service);
    expect(html).toContain(title);
    expect(html).toContain(condition);
  });

  it.each(legacyLocales)("falls back to services while no project is authorized on the %s legacy homepage", async (locale) => {
    contactMock.enabled = false;
    const dictionary = getDictionary(locale);
    expect(getHomepage(locale).cta).toEqual({
      href: "#services",
      text: dictionary.cta.services,
    });
    expect(getHomepage(locale).contactFormEnabled).toBe(false);
    const html = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: locale }) }));
    expect(html).not.toContain('class="cta-fila"');
    expect(html).toContain('href="mailto:info@obraxen.com"');
  });

  it.each(legacyLocales)("uses assessment when the contact form is enabled on the %s legacy homepage", async (locale) => {
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

  it("renders EN and DE operational copy with conditional interventions", async () => {
    const english = getDictionary("en");
    const german = getDictionary("de");
    const englishHtml = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: "en" }) }));
    const germanHtml = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: "de" }) }));

    expect(english.hero.kicker).toBe("Industrial floors for logistics and production");
    expect(english.hero.body).toContain("intended use");
    expect(english.hero.body).toContain("concrete rehabilitation or grinding and polishing");
    expect(englishHtml).toContain(english.hero.body);
    expect(german.hero.kicker).toBe("Industrieböden für Logistik und Produktion");
    expect(german.hero.body).toContain("wenn die Diagnose dies erfordert");
    expect(german.services.items.map(({ title }) => title)).toContain("Betonschleifen und -polieren");
    expect(germanHtml).toContain(german.hero.body);
  });

  it.each(legacyLocales)("keeps visible project text inside accessible names in %s", async (locale) => {
    const dictionary = getDictionary(locale);
    const html = renderToStaticMarkup(await HomePage({ params: Promise.resolve({ lang: locale }) }));
    expect((html.match(new RegExp(`>${dictionary.projectsSection.openCase} <span aria-hidden="true">`, "g")) ?? []))
      .toHaveLength(publicProjects.length);
    for (const project of publicProjects) {
      expect(html).toContain(`aria-label="${dictionary.projectsSection.openCaseAria} ${project.cliente}"`);
    }
  });

  it("does not retain an image import for an unauthorized project", () => {
    expect(() => getProjectImage(internalProjects[0].imagenes[0].src)).toThrow("No existe un import de imagen");
  });

  it.each(legacyLocales)("provides %s social metadata for the verified domain", async (locale) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: locale }) });
    expect(metadata.openGraph).toMatchObject({ type: "website" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.alternates).toMatchObject({
      canonical: `https://obraxen.com/${locale}/`,
      languages: { "x-default": "https://obraxen.com/es/" },
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
      languages: { "x-default": "https://example.com/es/" },
    });
    expect(metadata.openGraph).toMatchObject({ url: `https://example.com/${locale}/` });
  });
});
