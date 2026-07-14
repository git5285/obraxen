/* eslint-disable @next/next/no-html-link-for-pages */
import type { Project } from "@/lib/schemas";
import { getImageDimensions, getProjectImage } from "@/lib/homepage";
import {
  getExecutionFacts,
  getProjectLocation,
  getProjectNeighbors,
  naturalList,
} from "@/lib/project-pages";
import { ProjectFooter } from "./project-footer";
import { ProjectHeader } from "./project-header";
import { ResponsiveImage } from "./responsive-image";

type ProjectCaseProps = {
  project: Project;
};

export function ProjectCase({ project }: ProjectCaseProps) {
  const translation = project.traducciones.es;
  const executionFacts = getExecutionFacts(project);
  const { previous, next } = getProjectNeighbors(project);
  const resources = [
    project.maquinaria.length ? `Maquinaria: ${naturalList(project.maquinaria)}.` : null,
    project.materiales.length ? `Materiales: ${naturalList(project.materiales)}.` : null,
  ].filter((resource): resource is string => resource !== null);

  return (
    <>
      <a className="skip" href="#case-content">Saltar al contenido</a>
      <ProjectHeader variant="case" />

      <main id="case-content">
        <section className="case-hero">
          <span className="reference-mark" aria-hidden="true">{project.referencia}</span>
          <div className="case-wrap">
            <nav className="breadcrumbs" aria-label="Migas de pan">
              <ol>
                <li><a href="/">Inicio</a></li>
                <li><a href="/proyectos/">Proyectos</a></li>
                <li aria-current="page">{project.cliente}</li>
              </ol>
            </nav>

            <div className="case-heading">
              <div>
                <p className="case-kicker">Caso ejecutado · {project.referencia}</p>
                <h1>{translation.titulo}</h1>
                <p className="case-lede">{translation.problema}</p>
              </div>
              <dl className="case-facts">
                <div><dt>Cliente</dt><dd>{project.cliente}</dd></div>
                <div><dt>Sector</dt><dd>{project.sector}</dd></div>
                <div><dt>Ubicación</dt><dd>{getProjectLocation(project)}</dd></div>
              </dl>
            </div>

            <div className="scope-rail">
              <p>Alcance confirmado</p>
              <ul>
                {project.magnitudes.map((magnitude) => <li key={magnitude}>{magnitude}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="case-evidence" aria-labelledby="evidence-title">
          <div className="case-wrap">
            <div className="section-heading">
              <div>
                <p className="case-kicker">Evidencia fotográfica</p>
                <h2 id="evidence-title">Estado documentado de la intervención</h2>
              </div>
              <p>Las fotografías acreditan el estado visible y la ejecución mostrada. No se atribuyen plazos, continuidad operativa ni mejoras cuantificadas sin documentación adicional.</p>
            </div>
            <div className="evidence-grid">
              {project.imagenes.map((image) => {
                const source = getProjectImage(image.src);
                return (
                  <figure key={image.src}>
                    <ResponsiveImage
                      src={source}
                      alt={image.alt}
                      sizes="(max-width: 760px) 100vw, 55vw"
                      {...getImageDimensions(source, { width: 1400, height: 900 })}
                    />
                    <figcaption>{image.etapa}</figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>

        <section className="case-story" aria-labelledby="story-title">
          <div className="case-wrap story-layout">
            <aside className="case-dossier" aria-label="Ficha del proyecto">
              <p>Ficha de obra</p>
              <dl className="execution-facts">
                <div><dt>Referencia</dt><dd>{project.referencia}</dd></div>
                <div><dt>Estado</dt><dd>Obra ejecutada</dd></div>
                <div><dt>Resultado</dt><dd>Documentado mediante fotografías</dd></div>
                {executionFacts.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </aside>

            <div className="case-narrative">
              <p className="case-kicker">Lectura técnica</p>
              <h2 id="story-title">Problema, intervención y resultado</h2>
              <article>
                <span>01</span>
                <div><h3>Situación inicial</h3><p>{translation.problema}</p></div>
              </article>
              <article>
                <span>02</span>
                <div><h3>Intervención ejecutada</h3><p>{translation.solucion}</p></div>
              </article>
              <article>
                <span>03</span>
                <div><h3>Resultado documentado</h3><p>{translation.resultado}</p></div>
              </article>
              {resources.length ? (
                <article className="case-resources">
                  <span>04</span>
                  <div>
                    <h3>Medios confirmados</h3>
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

        <nav className="case-pagination case-wrap" aria-label="Otros casos">
          {previous ? (
            <a className="previous" href={`/proyectos/${previous.slug}/`}>
              <span>← Caso anterior</span>
              <strong>{previous.cliente} · {previous.ubicacion.ciudad}</strong>
            </a>
          ) : null}
          {next ? (
            <a className="next" href={`/proyectos/${next.slug}/`}>
              <span>Siguiente caso →</span>
              <strong>{next.cliente} · {next.ubicacion.ciudad}</strong>
            </a>
          ) : null}
        </nav>
      </main>

      <ProjectFooter variant="case" />
    </>
  );
}
