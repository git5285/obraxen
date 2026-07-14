import { getImageDimensions, getProjectImage, homepage } from "@/lib/homepage";
import { ResponsiveImage } from "./responsive-image";

export function ProjectsSection() {
  return (
    <section className="proyectos" id="proyectos">
      <div className="wrap">
        <div className="cab">
          <p className="kicker">Proyectos ejecutados</p>
          <h2>Alcance real y evidencia de obra</h2>
          <p className="proy-intro">
            Cada ficha recoge magnitudes confirmadas, fotografías de la obra y una lectura
            separada de la situación, la intervención ejecutada y el resultado que puede
            acreditarse.
          </p>
        </div>
        <div className="proy-grid">
          {homepage.projects.map((project) => {
            const translation = project.traducciones.es;
            return (
              <article className="proy" key={project.slug}>
                <div
                  className="proy-media"
                  aria-label={`Reportaje fotográfico de ${project.cliente}`}
                >
                  {project.imagenes.map((image) => {
                    const source = getProjectImage(image.src);
                    return (
                      <figure key={image.src}>
                        <ResponsiveImage
                          src={source}
                          alt={image.alt}
                          {...getImageDimensions(source, { width: 1400, height: 900 })}
                          sizes="(max-width: 860px) 62vw, 31vw"
                        />
                        <figcaption>{image.etapa}</figcaption>
                      </figure>
                    );
                  })}
                </div>
                <div className="cuerpo">
                  <div className="meta">
                    <span className="ref">{project.referencia}</span>
                    <span>{project.sector}</span>
                    <span>
                      {project.ubicacion.ciudad}, {project.ubicacion.pais}
                    </span>
                  </div>
                  <h3>{translation.titulo}</h3>
                  <ul className="proy-cifras" aria-label="Magnitudes confirmadas">
                    {project.magnitudes.map((magnitude) => (
                      <li key={magnitude}>{magnitude}</li>
                    ))}
                  </ul>
                  <div className="proy-resumen">
                    <strong>Situación</strong>
                    <p>{translation.problema}</p>
                  </div>
                  <a
                    className="proy-enlace"
                    href={`/proyectos/${project.slug}/`}
                    aria-label={`Ver el caso completo: ${project.cliente}`}
                  >
                    Ver el caso completo <span aria-hidden="true">→</span>
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
