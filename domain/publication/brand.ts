import brandSource from "../../data/brand.json";
import { brandSchema } from "./schemas";
import type { Locale } from "./activation.mjs";

export const brand = brandSchema.parse(brandSource);

export function getBrandTranslation(locale: Locale) {
  return brand.traducciones[locale];
}
