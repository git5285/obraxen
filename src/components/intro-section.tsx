type IntroSectionProps = {
  kicker: string;
  stats: readonly { value: string; label: string }[];
  copy: import("@/lib/dictionaries/types").Dictionary["intro"];
};

export function IntroSection({ kicker, stats, copy }: IntroSectionProps) {
  return (
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
        <div className="wrap method-summary" aria-label={copy.methodAria}>
          <p>{copy.methodWords.join(" ")}</p>
          <p>{copy.methodBody}</p>
        </div>
      </section>
  );
}
