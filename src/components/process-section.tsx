import { processSteps, sectors } from "@/lib/homepage";

export function ProcessSection() {
  return (
    <>
      <section className="proceso" id="proceso">
        <div className="wrap">
          <div className="cab">
            <p className="kicker">Cómo trabajamos</p>
            <h2 className="process-title">Un método en cuatro fases</h2>
          </div>
          <div className="tarjetas">
            {processSteps.map((step) => (
              <article className="tarjeta" key={step.number}>
                <span className="num">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sectores">
        <div className="wrap">
          <div className="cinta" aria-label="Sectores en los que trabajamos">
            {[false, true].map((duplicate) => (
              <div className="grupo" aria-hidden={duplicate || undefined} key={String(duplicate)}>
                {sectors.map((sector) => (
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
