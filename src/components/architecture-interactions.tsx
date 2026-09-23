"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

function useDismissableDetails() {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (ref.current?.open && event.target instanceof Node && !ref.current.contains(event.target)) ref.current.open = false;
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !ref.current?.open) return;
    event.preventDefault();
    ref.current.open = false;
    ref.current.querySelector("summary")?.focus();
  }
  function close() {
    if (ref.current) ref.current.open = false;
  }
  return { ref, onKeyDown, close };
}

export function ArchitectureLanguage({ languages }: { languages: readonly { code: string; label: string; href: string | null }[] }) {
  const { ref, onKeyDown } = useDismissableDetails();
  return <details className="ar-language-menu" ref={ref} onKeyDown={onKeyDown} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }}>
    <summary aria-label="ES · Seleccionar idioma">ES<span aria-hidden="true" /></summary>
    <div className="ar-language-panel">
      <p>Esta versión está disponible en español.</p>
      <nav aria-label="Seleccionar idioma">{languages.map(language => language.href ?
        <a key={language.code} href={language.href} hrefLang={language.code} lang={language.code} aria-current={language.code === "es" ? "page" : undefined}>{language.label}</a> :
        <span className="ar-language-unavailable" key={language.code}><span lang={language.code}>{language.label}</span><small>No disponible</small></span>
      )}</nav>
    </div>
  </details>;
}

export function ArchitectureMenu({ items }: { items: readonly (readonly [string, string])[] }) {
  const { ref, onKeyDown, close } = useDismissableDetails();
  const [open, setOpen] = useState(false);
  return <details className="ar-mobile-menu" ref={ref} onKeyDown={onKeyDown} onToggle={event => setOpen(event.currentTarget.open)} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }}>
    <summary aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}><span className="ar-menu-icon" aria-hidden="true" /></summary>
    <nav aria-label="Navegación móvil" onClick={(event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      close();
      const target = event.target.hash ? document.getElementById(event.target.hash.slice(1)) : null;
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }}>
      {items.map(([label, href]) => {
        const targetHref = href.startsWith("#") || href.startsWith("/") ? href : `#${href}`;
        return <a key={href} href={targetHref}>{label}</a>;
      })}
      <a href="#contact">Cuéntanos tu caso</a>
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
