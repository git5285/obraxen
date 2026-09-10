import Link from "next/link";

export function ArchitectureSolutionLink({ title, href }: { title: string; href: string }) {
  return <a className="ar-solution-consult" href={href} aria-label={`Consultar esta solución: ${title}`}>Consultar esta solución<span aria-hidden="true" className="ar-link-arrow" /></a>;
}

// Kept as a compatibility boundary for the alternative architecture preview.
// It deliberately contains no local collection or simulated submission flow.
export function ArchitectureContact({ compact = false }: { compact?: boolean }) {
  return <div className="ar-contact-route" data-compact={compact || undefined}>
    <h3>Formulario de contacto</h3>
    <p>Abre el formulario de la web vigente para dejar los datos de tu consulta.</p>
    <Link className="ar-button" href="/es/contacto/">Abrir formulario de contacto</Link>
    <p className="ar-note">No envía consultas ni guarda datos.</p>
  </div>;
}
