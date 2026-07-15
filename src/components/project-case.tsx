import type { Project } from "@/lib/schemas";
import { getImageDimensions, getProjectImage } from "@/lib/homepage";
import {
  getExecutionFacts,
  getProjectLocation,
  getProjectNeighbors,
  projectResources,
} from "@/lib/project-pages";
import { getDictionary, getPath, type Locale } from "@/lib/i18n";
import { ProjectFooter } from "./project-footer";
import { ProjectHeader } from "./project-header";
import { ResponsiveImage } from "./responsive-image";

type ProjectCaseProps = {
  project: Project;
  locale: Locale;
};

export function ProjectCase({ project, locale }: ProjectCaseProps) {
  const dictionary = getDictionary(locale);
  const copy = dictionary.projectCase;
  const hubCopy = dictionary.projectHub;
  const translation = project.traducciones[locale];
  const executionFacts = getExecutionFacts(project, locale);
  const { previous, next } = getProjectNeighbors(project);
  const resources = projectResources(project, locale);

  return (
    <>
      <a className="skip" href="#case-content">{dictionary.common.skipToContent}</a>
      <ProjectHeader variant="case" locale={locale} slug={project.slug} />

      <main id="case-content">
        <section className="case-hero">
          <span className="reference-mark" aria-hidden="true">{project.referencia}</span>
          <div className="case-wrap">
            <nav className="breadcrumbs" aria-label={dictionary.common.breadcrumbs}>
              <ol>
                <li><a href={getPath(locale, "home")}>{dictionary.common.home}</a></li>
                <li><a href={getPath(locale, "projects")}>{dictionary.common.projects}</a></li>
                <li aria-current="page">{project.cliente}</li>
              </ol>
            </nav>

            <div className="case-heading">
              <div>
                <p className="case-kicker">{copy.kicker} · {project.referencia}</p>
                <h1>{translation.titulo}</h1>
                <p className="case-lede">{translation.problema}</p>
              </div>
              <dl className="case-facts">
                <div><dt>{hubCopy.client}</dt><dd>{project.cliente}</dd></div>
                <div><dt>{hubCopy.sector}</dt><dd>{translation.sector}</dd></div>
                <div><dt>{hubCopy.location}</dt><dd>{getProjectLocation(project, locale)}</dd></div>
              </dl>
            </div>

            <div className="scope-rail">
              <p>{copy.confirmedScope}</p>
              <ul>
                {translation.magnitudes.map((magnitude) => <li key={magnitude}>{magnitude}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="case-evidence" aria-labelledby="evidence-title">
          <div className="case-wrap">
            <div className="section-heading">
              <div>
                <p className="case-kicker">{copy.photoKicker}</p>
                <h2 id="evidence-title">{copy.photoTitle}</h2>
              </div>
              <p>{copy.photoBody}</p>
            </div>
            <div className="evidence-grid">
              {project.imagenes.map((image, index) => {
                const source = getProjectImage(image.src);
                const localizedImage = translation.imagenes[index];
                return (
                  <figure key={image.src}>
                    <ResponsiveImage
                      src={source}
                      alt={localizedImage?.alt ?? ""}
                      sizes="(max-width: 760px) 100vw, 55vw"
                      {...getImageDimensions(source, { width: 1400, height: 900 })}
                    />
                    <figcaption>{localizedImage?.etapa}</figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>

        <section className="case-story" aria-labelledby="story-title">
          <div className="case-wrap story-layout">
            <aside className="case-dossier" aria-label={copy.dossier}>
              <p>{copy.dossier}</p>
              <dl className="execution-facts">
                <div><dt>{copy.reference}</dt><dd>{project.referencia}</dd></div>
                <div><dt>{copy.status}</dt><dd>{copy.executedStatus}</dd></div>
                <div><dt>{copy.result}</dt><dd>{copy.photoDocumented}</dd></div>
                {executionFacts.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </aside>

            <div className="case-narrative">
              <p className="case-kicker">{copy.technicalReading}</p>
              <h2 id="story-title">{copy.storyTitle}</h2>
              <article>
                <span>01</span>
                <div><h3>{copy.initialSituation}</h3><p>{translation.problema}</p></div>
              </article>
              <article>
                <span>02</span>
                <div><h3>{copy.executedIntervention}</h3><p>{translation.solucion}</p></div>
              </article>
              <article>
                <span>03</span>
                <div><h3>{copy.documentedResult}</h3><p>{translation.resultado}</p></div>
              </article>
              {resources.length ? (
                <article className="case-resources">
                  <span>04</span>
                  <div>
                    <h3>{copy.confirmedResources}</h3>
                    <p>
                      {resources.map((resource, index) => (
                        <span key={resource}>
                          {index ? " " : null}
                          <strong>{resource.slice(0, resource.indexOf(":") + 1)}</strong>
                          {resource.slice(resource.indexOf(":") + 1)}
                        </span>
                      ))}
                    </p>
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        </section>

        <nav className="case-pagination case-wrap" aria-label={copy.otherCases}>
          {previous ? (
            <a className="previous" href={getPath(locale, "projects", previous.slug)} data-analytics-event="project_open" data-analytics-project={previous.slug} data-analytics-location="case-pagination">
              <span>{copy.previousCase}</span>
              <strong>{previous.cliente} · {previous.ubicacion.ciudad}</strong>
            </a>
          ) : null}
          {next ? (
            <a className="next" href={getPath(locale, "projects", next.slug)} data-analytics-event="project_open" data-analytics-project={next.slug} data-analytics-location="case-pagination">
              <span>{copy.nextCase}</span>
              <strong>{next.cliente} · {next.ubicacion.ciudad}</strong>
            </a>
          ) : null}
        </nav>
      </main>

      <ProjectFooter variant="case" locale={locale} />
    </>
  );
}
