import brandSource from "../../data/brand.json";
import { brandSchema } from "./schemas";

export const brand = brandSchema.parse(brandSource);
