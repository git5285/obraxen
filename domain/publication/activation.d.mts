export declare const locales: readonly ['en', 'de', 'es', 'fr'];
export type Locale = (typeof locales)[number];
export interface ActivationBrand {
  legalRevisionAprobada: boolean;
  formularioProveedor: string | null;
  formularioRevisionAprobada: boolean;
  revisionTraducciones: Record<Locale, { estado: string }>;
}
export declare function getActivationIssues(brand: ActivationBrand): string[];
