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
import { publicProjects, publicProjectsBySlug } from "@/lib/projects";
import "../../../../../css/case.css";

type ProjectPageProps = Pick<PageProps<"/[lang]/[section]/[slug]">, "params">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjectParams(publicProjects.map(({ slug }) => slug));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { lang, section, slug } = await params;
  if (!isLocale(lang) || getRouteForSection(lang, section) !== "projects") return {};
  const project = publicProjectsBySlug.get(slug);
  return project ? getProjectMetadata(project, lang) : {};
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { lang, section, slug } = await params;
  if (!isLocale(lang) || getRouteForSection(lang, section) !== "projects") notFound();
  const project = publicProjectsBySlug.get(slug);
  if (!project) notFound();

  return (
    <>
      <ProjectCase project={project} locale={lang} />
      <ProjectJsonLd value={getProjectJsonLd(project, lang)} />
    </>
  );
}
