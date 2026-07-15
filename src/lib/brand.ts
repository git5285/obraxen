import brandSource from "../../data/brand.json";
import { brandSchema } from "./schemas";
import type { Locale } from "./i18n";

export const brand = brandSchema.parse(brandSource);

export function getBrandTranslation(locale: Locale) {
  return brand.traducciones[locale];
}
