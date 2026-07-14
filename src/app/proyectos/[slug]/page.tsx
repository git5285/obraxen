import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCase } from "@/components/project-case";
import { ProjectJsonLd } from "@/components/project-json-ld";
import { getProjectJsonLd, getProjectMetadata } from "@/lib/project-pages";
import { projects, projectsBySlug } from "@/lib/projects";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projectsBySlug.get(slug);
  if (!project) return {};
  return getProjectMetadata(project);
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projectsBySlug.get(slug);
  if (!project) notFound();

  return (
    <>
      <ProjectCase project={project} />
      <ProjectJsonLd value={getProjectJsonLd(project)} />
    </>
  );
}
