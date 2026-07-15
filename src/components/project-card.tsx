import type { Project } from "@/lib/schemas";
import { getImageDimensions, getProjectImage } from "@/lib/homepage";
import { getProjectLocation } from "@/lib/project-pages";
import { getDictionary, getPath, type Locale } from "@/lib/i18n";
import { Fragment } from "react";
import { ResponsiveImage } from "./responsive-image";

type ProjectCardProps = {
  project: Project;
  locale: Locale;
};

export function ProjectCard({ project, locale }: ProjectCardProps) {
  const translation = project.traducciones[locale];
  const copy = getDictionary(locale).projectHub;
  const galleryLabel = translation.imagenes.map(({ etapa }) => etapa).join(" ");
  const href = getPath(locale, "projects", project.slug);
  const hasConfirmedPositiveClose =
    project.cierre.entregaConforme &&
    project.cierre.correccionesPosteriores === false;

  return (
    <article className="project-dossier" id={project.slug}>
      <header className="dossier-header">
        <p className="dossier-reference">{copy.projectReference} {project.referencia}</p>
        <dl>
          <div><dt>{copy.client}</dt><dd>{project.cliente}</dd></div>
          <div><dt>{copy.sector}</dt><dd>{translation.sector}</dd></div>
          <div><dt>{copy.location}</dt><dd>{getProjectLocation(project, locale)}</dd></div>
        </dl>
      </header>

      <a
        className="dossier-media"
        href={href}
        aria-label={`${galleryLabel}. ${copy.galleryAria} ${project.cliente}`}
        data-analytics-event="project_open"
        data-analytics-project={project.slug}
        data-analytics-location="projects-hub-gallery"
      >
        <div
          className="contact-sheet"
          role="group"
          aria-label={`${copy.evidenceAria} ${project.cliente}`}
        >
          {project.imagenes.map((image, index) => {
            const source = getProjectImage(image.src);
            const localizedImage = translation.imagenes[index];
            return (
              <Fragment key={image.src}>
                <figure>
                  <ResponsiveImage
                    src={source}
                    alt={localizedImage?.alt ?? ""}
                    sizes="(max-width: 860px) 100vw, 50vw"
                    {...getImageDimensions(source, { width: 1400, height: 900 })}
                  />
                  <figcaption>{localizedImage?.etapa}</figcaption>
                </figure>{" "}
              </Fragment>
            );
          })}
        </div>
      </a>

      <div className="dossier-body">
        <div className="dossier-intro">
          <p className="projects-kicker">{copy.documentedSituation}</p>
          <h2>{translation.titulo}</h2>
          <p>{translation.problema}</p>
        </div>

        <div className="dossier-intervention">
          <h3>{copy.executedIntervention}</h3>
          <p>{translation.solucion}</p>
          <ul aria-label={getDictionary(locale).projectsSection.magnitudesAria}>
            {translation.magnitudes.map((magnitude) => <li key={magnitude}>{magnitude}</li>)}
          </ul>
        </div>

        {hasConfirmedPositiveClose ? (
          <div className="dossier-close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
            <p><strong>{copy.confirmedClose}</strong> {copy.confirmedCloseBody}</p>
          </div>
        ) : null}

        <a
          className="dossier-link"
          href={href}
          aria-label={`${copy.openDossierAria} ${project.cliente}`}
          data-analytics-event="project_open"
          data-analytics-project={project.slug}
          data-analytics-location="projects-hub-card"
        >
          {copy.openDossier} <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
