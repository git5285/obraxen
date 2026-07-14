"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { NavigationItem } from "@/lib/homepage";
import { CtaLink } from "./cta-link";
import { LogoMark } from "./logo-mark";

type NavigationContextValue = {
  isOpen: boolean;
  openMenu: (trigger: HTMLButtonElement) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

type SiteNavigationProps = {
  brandName: string | null;
  cta: { href: string; text: string };
  items: readonly NavigationItem[];
  children: ReactNode;
};

export function SiteNavigation({ brandName, cta, items, children }: SiteNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function openMenu(trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setIsOpen(true);
  }

  function closeMenu({ restoreFocus = true } = {}) {
    setIsOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }

  function handleMenuLink(href: string) {
    closeMenu({ restoreFocus: false });
    if (!href.startsWith("#")) return;
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
        once: true,
      });
    });
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== "Tab" || !menuRef.current) return;

    const focusable = Array.from(
      menuRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"),
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  useEffect(() => {
    document.body.classList.toggle("menu-abierto", isOpen);
    if (isOpen) closeButtonRef.current?.focus({ preventScroll: true });
    return () => document.body.classList.remove("menu-abierto");
  }, [isOpen]);

  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const heroObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    heroObserver.observe(hero);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const item of items) {
      if (!item.section) continue;
      const section = document.getElementById(item.section);
      if (section) sectionObserver.observe(section);
    }

    return () => {
      heroObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, [items]);

  return (
    <NavigationContext value={{ isOpen, openMenu }}>
      <nav
        className={`movil-menu${isOpen ? " abierto" : ""}`}
        id="menuMovil"
        aria-label="Menú móvil"
        aria-hidden={!isOpen}
        inert={!isOpen}
        ref={menuRef}
        onKeyDown={handleMenuKeyDown}
      >
        <button
          className="cerrar"
          type="button"
          aria-label="Cerrar menú"
          ref={closeButtonRef}
          onClick={() => closeMenu()}
        >
          ×
        </button>
        {items.map((item) => (
          <a key={item.href} href={item.href} onClick={() => handleMenuLink(item.href)}>
            {item.label}
          </a>
        ))}
        <a className="btn btn-acento" href={cta.href} onClick={() => handleMenuLink(cta.href)}>
          {cta.text}
        </a>
      </nav>

      <nav
        className={`sticky-nav${stickyVisible ? " visible" : ""}`}
        aria-label="Navegación principal"
        aria-hidden={!stickyVisible}
        inert={!stickyVisible}
      >
        <div className="inner">
          <LogoMark brandName={brandName} />
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <a
                  className={item.section === activeSection ? "activo" : undefined}
                  href={item.href}
                  aria-current={item.section === activeSection ? "location" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <MenuButton />
          <CtaLink href={cta.href}>{cta.text}</CtaLink>
        </div>
      </nav>

      {children}
    </NavigationContext>
  );
}

export function MenuButton() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("MenuButton debe estar dentro de SiteNavigation");

  return (
    <button
      className="menu-btn"
      type="button"
      aria-label="Abrir menú"
      aria-controls="menuMovil"
      aria-expanded={context.isOpen}
      onClick={(event) => context.openMenu(event.currentTarget)}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
