import { brand } from "@/lib/brand";
import { offers } from "@/lib/offers";
import { projects } from "@/lib/projects";
import { getPublicationState } from "@/lib/publication";

export default function FoundationPage() {
  const publication = getPublicationState(brand);
  const publicableOffers = offers.filter(
    (offer) => offer.estadoPublicacion === "publicable",
  ).length;

  return (
    <main className="foundation-shell">
      <section className="foundation-panel" aria-labelledby="foundation-title">
        <p className="foundation-kicker">Fase 1 · Fundación Next.js</p>
        <h1 id="foundation-title">{brand.claim}</h1>
        <p className="foundation-summary">
          Esta ruta verifica App Router, tipado y puertas de publicación. La web
          estática continúa siendo la referencia hasta que la portada y las rutas
          actuales alcancen paridad en las siguientes fases.
        </p>
        <dl className="foundation-status">
          <div>
            <dt>Entorno</dt>
            <dd>{publication.mode === "preview" ? "Preview cerrada" : "Público"}</dd>
          </div>
          <div>
            <dt>Casos validados</dt>
            <dd>{projects.length}</dd>
          </div>
          <div>
            <dt>Ofertas publicables</dt>
            <dd>{publicableOffers}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
