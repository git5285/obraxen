import { offers } from "./offers";

export const publicableOffers = offers.filter(
  (offer) => offer.estadoPublicacion === "publicable",
);

export const hasPublicableSolutions = publicableOffers.length > 0;

export function getPublicableOffers() {
  return publicableOffers;
}
