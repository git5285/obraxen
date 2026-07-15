type IntroSectionProps = {
  kicker: string;
  stats: readonly { value: string; label: string }[];
  copy: import("@/lib/dictionaries/types").Dictionary["intro"];
};

export function IntroSection({ kicker, stats, copy }: IntroSectionProps) {
  return (
    <>
      <section className="intro">
        <div className="wrap fila">
          <div>
            <p className="kicker">{kicker}</p>
            <h2>{copy.title}</h2>
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

      <section className="relato" aria-label={copy.methodAria}>
        <div className="wrap">
          <p className="linea">{copy.methodWords[0]}</p>
          <p className="linea">{copy.methodWords[1]}</p>
          <p className="linea acento">{copy.methodWords[2]}</p>
          <p className="pie">{copy.methodBody}</p>
        </div>
      </section>
    </>
  );
}
