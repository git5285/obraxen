import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCase } from "@/components/project-case";
import { ProjectJsonLd } from "@/components/project-json-ld";
import { getProjectParams } from "@/lib/i18n";
import { getProjectJsonLd, getProjectMetadata } from "@/lib/project-pages";
import { publicProjects } from "@/lib/projects";
import { resolveProjectRoute } from "@/lib/project-route";
import "../../../../../css/case.css";

type ProjectPageProps = Pick<PageProps<"/[lang]/[section]/[slug]">, "params">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjectParams(publicProjects.map(({ slug }) => slug));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const resolved = resolveProjectRoute(await params);
  return resolved ? getProjectMetadata(resolved.project, resolved.locale) : {};
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolved = resolveProjectRoute(await params);
  if (!resolved) notFound();
  const { project, locale } = resolved;

  return (
    <>
      <ProjectCase project={project} locale={locale} />
      <ProjectJsonLd value={getProjectJsonLd(project, locale)} />
    </>
  );
}
