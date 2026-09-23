import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { locales, routeSegments } from "@/lib/i18n";
import { internalProjects } from "@/lib/internal-projects";
import { resolveProjectRoute } from "@/lib/project-route";
import { publicProjectsBySlug } from "@/lib/projects";
import ProjectPage, { generateMetadata, generateStaticParams } from "@/app/[lang]/[section]/[slug]/page";
import { getProjectMetadata } from "@/lib/project-pages";
import * as media from "@/lib/media";

afterEach(() => vi.restoreAllMocks());

describe("project route contract", () => {
  const project = {
    ...internalProjects[0],
    imagenes: [{ src: "refactor-fixture.webp", alt: "Fixture", etapa: "resultado" as const }],
  };
  const fixture = new Map([[project.slug, project]]);

  it.each(locales)("resolves %s without changing the project", (locale) => {
    expect(resolveProjectRoute({ lang: locale, section: routeSegments[locale].projects, slug: project.slug }, fixture))
      .toEqual({ project, locale });
  });

  it.each([
    { lang: "pt", section: "projects", slug: project.slug },
    { lang: "en", section: "projekte", slug: project.slug },
    { lang: "en", section: "projects", slug: "unknown" },
  ])("keeps metadata empty and page 404 for $lang/$section/$slug", async (params) => {
    vi.spyOn(publicProjectsBySlug, "get").mockImplementation((slug) => fixture.get(slug));
    expect(resolveProjectRoute(params, fixture)).toBeNull();
    expect(await generateMetadata({ params: Promise.resolve(params) })).toEqual({});
    await expect(ProjectPage({ params: Promise.resolve(params) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it.each(locales)("preserves metadata and page props for a fixture in %s", async (locale) => {
    vi.spyOn(publicProjectsBySlug, "get").mockImplementation((slug) => fixture.get(slug));
    vi.spyOn(publicProjectsBySlug, "has").mockImplementation((slug) => fixture.has(slug));
    vi.spyOn(media, "getProjectImage").mockReturnValue({ src: "/refactor-fixture.webp", width: 100, height: 100 });
    const params = Promise.resolve({ lang: locale, section: routeSegments[locale].projects, slug: project.slug });
    const metadata = await generateMetadata({ params });
    expect(metadata).toEqual(getProjectMetadata(project, locale));
    expect(metadata.title).toContain(project.traducciones[locale].titulo);
    const page = await ProjectPage({ params });
    expect(page.props.children[0].props).toEqual({ project, locale });
    expect(JSON.parse(page.props.children[1].props.value)["@graph"][0].inLanguage).toBe(locale);
    const html = renderToStaticMarkup(page);
    expect(html).toContain(project.traducciones[locale].titulo);
    expect(html).toContain("/refactor-fixture.webp");
  });

  it("keeps the current public static inventory empty", () => {
    expect(generateStaticParams()).toEqual([]);
  });
});
