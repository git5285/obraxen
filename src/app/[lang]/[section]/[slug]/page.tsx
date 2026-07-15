import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCase } from "@/components/project-case";
import { ProjectJsonLd } from "@/components/project-json-ld";
import {
  getProjectParams,
  getRouteForSection,
  isLocale,
} from "@/lib/i18n";
import { getProjectJsonLd, getProjectMetadata } from "@/lib/project-pages";
import { projects, projectsBySlug } from "@/lib/projects";

type ProjectPageProps = {
  params: Promise<{ lang: string; section: string; slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjectParams(projects.map(({ slug }) => slug));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { lang, section, slug } = await params;
  if (!isLocale(lang) || getRouteForSection(lang, section) !== "projects") return {};
  const project = projectsBySlug.get(slug);
  return project ? getProjectMetadata(project, lang) : {};
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { lang, section, slug } = await params;
  if (!isLocale(lang) || getRouteForSection(lang, section) !== "projects") notFound();
  const project = projectsBySlug.get(slug);
  if (!project) notFound();

  return (
    <>
      <ProjectCase project={project} locale={lang} />
      <ProjectJsonLd value={getProjectJsonLd(project, lang)} />
    </>
  );
}
