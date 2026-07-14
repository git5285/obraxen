import { getImageDimensions, otherWorks, services } from "@/lib/homepage";
import { ResponsiveImage } from "./responsive-image";
import { ServiceIcon } from "./service-icon";

export function ServicesSection({ cta }: { cta: { href: string; text: string } }) {
  return (
    <section className="servicios" id="servicios">
      <div className="wrap">
        <div className="cab">
          <p className="kicker kicker-center">Qué hacemos</p>
          <h2>Soluciones definidas según el daño y la operativa</h2>
          <p>
            Una intervención puede combinar preparación, reparaciones localizadas,
            nivelación y tratamiento superficial. El diagnóstico determina qué partidas
            hacen falta.
          </p>
        </div>
        <div className="serv-grid">
          {services.map((service) => (
            <article className="serv foto" key={service.title}>
              <ResponsiveImage
                className="tex"
                src={service.image}
                alt=""
                {...getImageDimensions(service.image, { width: 1280, height: 720 })}
                sizes="(max-width: 860px) calc(100vw - 48px), 50vw"
              />
              <div className="capa">
                <ServiceIcon name={service.icon} />
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a className="capa-cta" href={cta.href}>
                  {cta.text} →
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="catalogo">
          <h3>Otros trabajos que podemos abordar:</h3>
          <ul>
            {otherWorks.map((work) => (
              <li key={work}>{work}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
