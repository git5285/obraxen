import type { Dictionary } from "@/lib/dictionaries/types";

export function ProcessSection({ copy }: { copy: Dictionary["process"] }) {
  return (
    <>
      <section className="proceso" id="process">
        <div className="wrap">
          <div className="cab">
            <p className="kicker">{copy.kicker}</p>
            <h2 className="process-title">{copy.title}</h2>
          </div>
          <div className="tarjetas">
            {copy.steps.map((step, index) => (
              <article className="tarjeta" key={step.title}>
                <span className="num">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sectores">
        <div className="wrap">
          <div className="cinta" aria-label={copy.sectorsAria}>
            {[false, true].map((duplicate) => (
              <div className="grupo" aria-hidden={duplicate || undefined} key={String(duplicate)}>
                {copy.sectors.map((sector) => (
                  <span className="sector" key={sector}>
                    {sector}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
