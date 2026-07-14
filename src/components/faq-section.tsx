import { frequentlyAskedQuestions } from "@/lib/homepage";

export function FaqSection() {
  return (
    <section className="faq" id="faq">
      <div className="wrap fila">
        <div className="col-izq">
          <p className="kicker">Resolvemos dudas</p>
          <h2>Preguntas frecuentes sobre reparación de pavimentos</h2>
          <p>
            Las dudas que más nos plantean responsables de mantenimiento y operaciones
            antes de una intervención.
          </p>
        </div>
        <div>
          {frequentlyAskedQuestions.map(({ question, answer }) => (
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
