import type { StaticImageData } from "next/image";
import { getImageDimensions } from "@/lib/media";
import type { Dictionary } from "@/lib/dictionaries/types";
import { CtaLink } from "./cta-link";
import { ResponsiveImage } from "./responsive-image";

type CompanySectionProps = {
  cta: { href: string; text: string };
  image: StaticImageData;
  kicker: string;
  hasOwnTeams: boolean;
  priorityMarketsLabel: string;
  copy: Dictionary["company"];
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
  copy,
}: CompanySectionProps) {
  return (
    <section className="porque" id="company">
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
            <h2>{copy.title}</h2>
            <p>{copy.intro}</p>
            <span className="inline-block">
              <CtaLink href={cta.href} eventLocation="company">{cta.text}</CtaLink>
            </span>
          </div>
          <div className="ventajas">
            <article className="ventaja">
              <AdvantageIcon name="diagnosis" />
              <div>
                <h3>{copy.diagnosisTitle}</h3>
                <p>{copy.diagnosisBody}</p>
              </div>
            </article>
            {hasOwnTeams ? (
              <article className="ventaja">
                <AdvantageIcon name="team" />
                <div>
                  <h3>{copy.teamsTitle}</h3>
                  <p>{copy.teamsBody}</p>
                </div>
              </article>
            ) : null}
            <article className="ventaja">
              <AdvantageIcon name="time" />
              <div>
                <h3>{copy.operationsTitle}</h3>
                <p>{copy.operationsBody}</p>
              </div>
            </article>
            <article className="ventaja">
              <AdvantageIcon name="europe" />
              <div>
                <h3>{copy.europeTitle}</h3>
                <p>{copy.europeBody.replace("{markets}", priorityMarketsLabel)}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
