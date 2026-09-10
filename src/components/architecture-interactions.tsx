"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

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
