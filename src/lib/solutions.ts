import { offers } from "./offers";

export const publicableOffers = offers.filter(
  (offer) => offer.estadoPublicacion === "publicable",
);
