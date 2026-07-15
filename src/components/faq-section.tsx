import type { Dictionary } from "@/lib/dictionaries/types";

export function FaqSection({ copy }: { copy: Dictionary["faq"] }) {
  return (
    <section className="faq" id="faq">
      <div className="wrap fila">
        <div className="col-izq">
          <p className="kicker">{copy.kicker}</p>
          <h2>{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <div>
          {copy.items.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
