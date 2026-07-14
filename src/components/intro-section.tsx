type IntroSectionProps = {
  kicker: string;
  stats: readonly { value: string; label: string }[];
};

export function IntroSection({ kicker, stats }: IntroSectionProps) {
  return (
    <>
      <section className="intro">
        <div className="wrap fila">
          <div>
            <p className="kicker">{kicker}</p>
            <h2>Soluciones para suelos que no pueden permitirse parar</h2>
          </div>
          <div className="stats">
            {stats.map(({ value, label }) => {
              const accentStart = value.startsWith("+") || value.startsWith("<");
              return (
                <div className="stat" key={label}>
                  <b>
                    {accentStart ? value[0] : null}
                    <i>{accentStart ? value.slice(1) : value}</i>
                  </b>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relato" aria-label="Nuestro método en tres palabras">
        <div className="wrap">
          <p className="linea">Diagnosticar.</p>
          <p className="linea">Reparar.</p>
          <p className="linea acento">Rendir.</p>
          <p className="pie">
            Tres palabras, un método: identificar la causa, definir la intervención y
            devolver el pavimento al trabajo.
          </p>
        </div>
      </section>
    </>
  );
}
