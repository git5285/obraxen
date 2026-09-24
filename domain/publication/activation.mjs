// Internal publication policy, not the public Home's route or language contract.
// Keep this module independent of either web application and external services.
export const locales = Object.freeze(['en', 'de', 'es', 'fr']);

export function getActivationIssues(brand) {
  const issues = [];
  if (!brand.legalRevisionAprobada) {
    issues.push('la revisión legal debe estar aprobada antes de publicar');
  }
  if (brand.formularioProveedor !== 'Resend' || !brand.formularioRevisionAprobada) {
    issues.push('el proveedor de captación y su tratamiento deben estar aprobados antes de publicar');
  }
  for (const locale of locales) {
    if (brand.revisionTraducciones[locale].estado !== 'aprobada') {
      issues.push(`la traducción ${locale} necesita revisión profesional aprobada`);
    }
  }
  return issues;
}
