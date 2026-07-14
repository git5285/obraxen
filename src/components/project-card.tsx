import type { Project } from "@/lib/schemas";
import { getImageDimensions, getProjectImage } from "@/lib/homepage";
import { getProjectLocation } from "@/lib/project-pages";
import { Fragment } from "react";
import { ResponsiveImage } from "./responsive-image";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const translation = project.traducciones.es;
  const galleryLabel = project.imagenes.map(({ etapa }) => etapa).join(" ");
  const href = `/proyectos/${project.slug}/`;
  const hasConfirmedPositiveClose =
    project.cierre.entregaConforme &&
    project.cierre.correccionesPosteriores === false;

  return (
    <article className="project-dossier" id={project.slug}>
      <header className="dossier-header">
        <p className="dossier-reference">Obra {project.referencia}</p>
        <dl>
          <div><dt>Cliente</dt><dd>{project.cliente}</dd></div>
          <div><dt>Sector</dt><dd>{project.sector}</dd></div>
          <div><dt>Ubicación</dt><dd>{getProjectLocation(project)}</dd></div>
        </dl>
      </header>

      <a
        className="dossier-media"
        href={href}
        aria-label={`${galleryLabel}. Abrir la ficha completa de ${project.cliente}`}
      >
        <div
          className="contact-sheet"
          role="group"
          aria-label={`Evidencia fotográfica de ${project.cliente}`}
        >
          {project.imagenes.map((image) => {
            const source = getProjectImage(image.src);
            return (
              <Fragment key={image.src}>
                <figure>
                  <ResponsiveImage
                    src={source}
                    alt={image.alt}
                    sizes="(max-width: 860px) 100vw, 50vw"
                    {...getImageDimensions(source, { width: 1400, height: 900 })}
                  />
                  <figcaption>{image.etapa}</figcaption>
                </figure>{" "}
              </Fragment>
            );
          })}
        </div>
      </a>

      <div className="dossier-body">
        <div className="dossier-intro">
          <p className="projects-kicker">Situación documentada</p>
          <h2>{translation.titulo}</h2>
          <p>{translation.problema}</p>
        </div>

        <div className="dossier-intervention">
          <h3>Intervención ejecutada</h3>
          <p>{translation.solucion}</p>
          <ul aria-label="Magnitudes confirmadas">
            {project.magnitudes.map((magnitude) => <li key={magnitude}>{magnitude}</li>)}
          </ul>
        </div>

        {hasConfirmedPositiveClose ? (
          <div className="dossier-close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
            <p><strong>Cierre confirmado</strong> Entrega conforme y sin correcciones posteriores.</p>
          </div>
        ) : null}

        <a
          className="dossier-link"
          href={href}
          aria-label={`Abrir ficha de obra: ${project.cliente}`}
        >
          Abrir ficha de obra <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
