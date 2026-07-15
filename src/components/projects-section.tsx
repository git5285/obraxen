import { getImageDimensions, getProjectImage } from "@/lib/homepage";
import { getDictionary, getPath, type Locale } from "@/lib/i18n";
import { projects } from "@/lib/projects";
import { ResponsiveImage } from "./responsive-image";

export function ProjectsSection({ locale }: { locale: Locale }) {
  const copy = getDictionary(locale).projectsSection;
  return (
    <section className="proyectos" id="proyectos">
      <div className="wrap">
        <div className="cab">
          <p className="kicker">{copy.kicker}</p>
          <h2>{copy.title}</h2>
          <p className="proy-intro">{copy.intro}</p>
        </div>
        <div className="proy-grid">
          {projects.map((project) => {
            const translation = project.traducciones[locale];
            return (
              <article className="proy" key={project.slug}>
                <div
                  className="proy-media"
                  aria-label={`${copy.galleryAria} ${project.cliente}`}
                >
                  {project.imagenes.map((image, index) => {
                    const source = getProjectImage(image.src);
                    const localizedImage = translation.imagenes[index];
                    return (
                      <figure key={image.src}>
                        <ResponsiveImage
                          src={source}
                          alt={localizedImage?.alt ?? ""}
                          {...getImageDimensions(source, { width: 1400, height: 900 })}
                          sizes="(max-width: 860px) 62vw, 31vw"
                        />
                        <figcaption>{localizedImage?.etapa}</figcaption>
                      </figure>
                    );
                  })}
                </div>
                <div className="cuerpo">
                  <div className="meta">
                    <span className="ref">{project.referencia}</span>
                    <span>{translation.sector}</span>
                    <span>
                      {project.ubicacion.ciudad}, {translation.pais}
                    </span>
                  </div>
                  <h3>{translation.titulo}</h3>
                  <ul className="proy-cifras" aria-label={copy.magnitudesAria}>
                    {translation.magnitudes.map((magnitude) => (
                      <li key={magnitude}>{magnitude}</li>
                    ))}
                  </ul>
                  <div className="proy-resumen">
                    <strong>{copy.situation}</strong>
                    <p>{translation.problema}</p>
                  </div>
                  <a
                    className="proy-enlace"
                    href={getPath(locale, "projects", project.slug)}
                    aria-label={`${copy.openCaseAria} ${project.cliente}`}
                    data-analytics-event="project_open"
                    data-analytics-project={project.slug}
                    data-analytics-location="homepage"
                  >
                    {copy.openCase} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
