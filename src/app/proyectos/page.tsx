/* eslint-disable @next/next/no-html-link-for-pages */
import { ProjectCard } from "@/components/project-card";
import { ProjectFooter } from "@/components/project-footer";
import { ProjectHeader } from "@/components/project-header";
import { ProjectJsonLd } from "@/components/project-json-ld";
import {
  projectsJsonLd,
  projectsMetadata,
} from "@/lib/project-pages";
import { projects } from "@/lib/projects";

export const metadata = projectsMetadata;

export default function ProjectsPage() {
  return (
    <>
      <a className="skip" href="#projects-content">Saltar al contenido</a>
      <ProjectHeader variant="projects" />

      <main id="projects-content">
        <section className="projects-hero" aria-labelledby="projects-title">
          <div className="projects-wrap">
            <nav className="breadcrumbs" aria-label="Migas de pan">
              <ol>
                <li><a href="/">Inicio</a></li>
                <li aria-current="page">Proyectos</li>
              </ol>
            </nav>

            <div className="projects-hero-grid">
              <div>
                <p className="projects-kicker">Archivo de proyectos</p>
                <h1 id="projects-title">Obras ejecutadas, explicadas desde la evidencia.</h1>
              </div>
              <div className="projects-hero-copy">
                <p>Cada expediente separa la situación inicial, la intervención, las magnitudes confirmadas y el cierre documentado. Las fotografías muestran lo visible; los datos que aún no están acreditados permanecen fuera.</p>
                <p className="archive-note"><strong>{projects.length} obras documentadas</strong> · La publicación final permanece sujeta a la puerta de evidencia.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="projects-archive" aria-label="Archivo de obras ejecutadas">
          <div className="projects-wrap">
            {projects.map((project) => <ProjectCard key={project.slug} project={project} />)}
          </div>
        </section>
      </main>

      <ProjectFooter variant="projects" />
      <ProjectJsonLd value={projectsJsonLd} />
    </>
  );
}
