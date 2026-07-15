export function getLighthouseBudgets({
  isPublic,
  isCi,
}: {
  isPublic: boolean;
  isCi: boolean;
}) {
  return {
    // El score compuesto varía con la carga del runner. Se conserva como smoke
    // test y los límites duros de LCP, TBT y CLS siguen siendo la puerta real.
    performance: 0.9,
    accessibility: 1,
    "best-practices": 1,
    // El noindex deliberado limita el SEO de preview. Un candidato público ya
    // no puede superar el gate con el presupuesto reducido de ese estado.
    seo: isPublic ? 0.95 : 0.65,
    // El objetivo de campo sigue siendo 2,5 s. Local conserva 3 s; el runner CI
    // admite 250 ms más porque su mediana incluye variación de infraestructura.
    lcp: isCi ? 3_250 : 3_000,
    tbt: 200,
    cls: 0.1,
  } as const;
}
