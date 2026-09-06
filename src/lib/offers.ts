import offersSource from "../../data/ofertas.json";
import { internalProjectsBySlug } from "./internal-projects";
import { offersSchema } from "./schemas";

export const offers = offersSchema.parse(offersSource);

const offerSlugs = offers.map((offer) => offer.slug);

if (new Set(offerSlugs).size !== offerSlugs.length) {
  throw new Error("data/ofertas.json contiene slugs duplicados");
}

for (const offer of offers) {
  for (const evidence of offer.evidencia) {
    if (!internalProjectsBySlug.has(evidence.proyecto)) {
      throw new Error(
        `La oferta ${offer.slug} referencia un proyecto inexistente: ${evidence.proyecto}`,
      );
    }
  }
}
