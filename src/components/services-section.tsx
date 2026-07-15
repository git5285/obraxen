import { getImageDimensions } from "@/lib/homepage";
import type { Dictionary } from "@/lib/dictionaries/types";
import type { StaticImageData } from "next/image";
import type { ServiceIcon as ServiceIconName } from "@/lib/homepage";
import { ResponsiveImage } from "./responsive-image";
import { ServiceIcon } from "./service-icon";

export function ServicesSection({
  cta,
  copy,
  services,
}: {
  cta: { href: string; text: string };
  copy: Dictionary["services"];
  services: readonly {
    title: string;
    description: string;
    image: StaticImageData;
    icon: ServiceIconName;
  }[];
}) {
  return (
    <section className="servicios" id="services">
      <div className="wrap">
        <div className="cab">
          <p className="kicker kicker-center">{copy.kicker}</p>
          <h2>{copy.title}</h2>
          <p>{copy.intro}</p>
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
                <a
                  className="capa-cta"
                  href={cta.href}
                  data-analytics-event="cta_select"
                  data-analytics-location="service-card"
                  data-analytics-destination={cta.href}
                >
                  {cta.text} →
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="catalogo">
          <h3>{copy.otherTitle}</h3>
          <ul>
            {copy.otherWorks.map((work) => (
              <li key={work}>{work}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
