// Shared by web routes, validation and Node CLI consumers; keep dependency-free.
export const locales = ["en", "de", "es", "fr"] as const;
export type Locale = (typeof locales)[number];
