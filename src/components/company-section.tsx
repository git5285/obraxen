import type { StaticImageData } from "next/image";
import { getImageDimensions } from "@/lib/homepage";
import { CtaLink } from "./cta-link";
import { ResponsiveImage } from "./responsive-image";

type CompanySectionProps = {
  cta: { href: string; text: string };
  image: StaticImageData;
  kicker: string;
  hasOwnTeams: boolean;
  priorityMarketsLabel: string;
};

function AdvantageIcon({ name }: { name: "diagnosis" | "team" | "time" | "europe" }) {
  const paths = {
    diagnosis: (
      <>
        <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    team: (
      <>
        <path d="M4 18h16M6 18V9l6-4 6 4v9" />
        <path d="M9 18v-5h6v5" />
      </>
    ),
    time: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    europe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
      </>
    ),
  } as const;
  return (
    <div className="ico" aria-hidden="true">
      <svg className="ic" viewBox="0 0 24 24">
        {paths[name]}
      </svg>
    </div>
  );
}

export function CompanySection({
  cta,
  image,
  kicker,
  hasOwnTeams,
  priorityMarketsLabel,
}: CompanySectionProps) {
  return (
    <section className="porque" id="empresa">
      <div className="wrap">
        <div className="panel">
          <ResponsiveImage
            className="panel-bg"
            src={image}
            alt=""
            {...getImageDimensions(image, { width: 1280, height: 720 })}
            sizes="(max-width: 860px) calc(100vw - 48px), 1180px"
          />
          <div className="col-izq">
            <p className="kicker">{kicker}</p>
            <h2>Criterio de obra aplicado a cada reparación</h2>
            <p>
              Más de diez años de experiencia acumulada en ejecución y reparación sirven
              para plantear cada intervención según el soporte, el daño y la actividad de
              la instalación.
            </p>
            <span className="inline-block">
              <CtaLink href={cta.href}>{cta.text}</CtaLink>
            </span>
          </div>
          <div className="ventajas">
            <article className="ventaja">
              <AdvantageIcon name="diagnosis" />
              <div>
                <h3>Diagnóstico basado en ejecución</h3>
                <p>
                  El estado del soporte, el tipo de daño y las exigencias de tráfico
                  orientan la reparación propuesta.
                </p>
              </div>
            </article>
            {hasOwnTeams ? (
              <article className="ventaja">
                <AdvantageIcon name="team" />
                <div>
                  <h3>Equipos propios</h3>
                  <p>
                    La ejecución se realiza con equipos propios, manteniendo el control
                    directo sobre la planificación y el trabajo en obra.
                  </p>
                </div>
              </article>
            ) : null}
            <article className="ventaja">
              <AdvantageIcon name="time" />
              <div>
                <h3>Intervención adaptada a la actividad</h3>
                <p>
                  Cuando el alcance lo permite, proponemos fases, zonas acotadas u horarios
                  alternativos para reducir el impacto en tu operativa.
                </p>
              </div>
            </article>
            <article className="ventaja">
              <AdvantageIcon name="europe" />
              <div>
                <h3>Cobertura europea</h3>
                <p>
                  Trabajamos en toda la Unión Europea, con actividad principal en{" "}
                  {priorityMarketsLabel}.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
