"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export function ArchitectureSolutionLink({ title, href }: { title: string; href: string }) {
  return <a className="ar-solution-consult" href={href} aria-label={`Consultar esta solución: ${title}`}>Consultar esta solución<span aria-hidden="true" className="ar-link-arrow" /></a>;
}

export function ArchitectureSheetLink({ id, title }: { id: string; title: string }) {
  return <a className="ar-service-link" href={`#${id}`} aria-label={`Ver ficha técnica: ${title}`} onClick={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const sheet = document.getElementById(id);
    if (!(sheet instanceof HTMLDetailsElement)) return;
    event.preventDefault();
    sheet.closest(".ar-technical-sheets")?.querySelectorAll("details").forEach(detail => { detail.open = detail === sheet; });
    window.location.hash = id;
    sheet.querySelector("summary")?.focus({ preventScroll: true });
  }}>Ver ficha técnica</a>;
}

export function ArchitectureMenu({ items }: { items: readonly (readonly [string, string])[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  function close(event: KeyboardEvent) {
    if (event.key !== "Escape" || !menu.current) return;
    menu.current.open = false;
    menu.current.querySelector("summary")?.focus();
  }
  return <details className="ar-mobile-menu" ref={menu} onKeyDown={close} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}><span className="ar-menu-icon" aria-hidden="true" /></summary>
    <nav aria-label="Navegación móvil" onClick={(event) => {
      if (!(event.target instanceof HTMLAnchorElement) || !menu.current) return;
      menu.current.open = false;
      const target = document.getElementById(event.target.hash.slice(1));
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }}>
      {items.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
      <a href="#contact">Consultar proyecto</a>
    </nav>
  </details>;
}

export function ArchitectureCaseDetails({ name, children }: { name: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <details className="ar-case-full" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary aria-label={`${open ? "Cerrar caso" : "Ver caso"}: ${name}`}>
      {open ? "Cerrar caso" : "Ver caso"}
    </summary>
    {children}
  </details>;
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
