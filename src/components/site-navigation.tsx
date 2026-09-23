"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { Dictionary } from "@/lib/dictionaries/types";
import { useSectionNavigation } from "@/lib/use-section-navigation";
import { wrapTabFocus } from "@/lib/focus-navigation";

type SiteNavigationProps = {
  sectionIds: readonly string[];
  labels: Pick<Dictionary["common"], "mobileMenu" | "menuClose" | "mainNavigation">;
  mobileContent: ReactNode;
  stickyContent: ReactNode;
};

export function SiteNavigation({
  sectionIds,
  labels,
  mobileContent,
  stickyContent,
}: SiteNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function closeMenu({ restoreFocus = true } = {}) {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("site:menu-state", { detail: { open: false } }));
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

  function handleMenuClick(event: MouseEvent<HTMLElement>) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!link || !menuRef.current?.contains(link)) return;
    handleMenuLink(link.getAttribute("href") ?? "");
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
    wrapTabFocus(event, focusable, document.activeElement);
  }

  useEffect(() => {
    document.body.classList.toggle("menu-abierto", isOpen);
    if (isOpen) closeButtonRef.current?.focus({ preventScroll: true });
    return () => document.body.classList.remove("menu-abierto");
  }, [isOpen]);

  const { stickyVisible, stickyNavRef } = useSectionNavigation(sectionIds);

  useEffect(() => {
    function handleMenuOpen(event: Event) {
      const detail =
        event instanceof CustomEvent && event.detail && typeof event.detail === "object"
          ? (event.detail as { trigger?: unknown })
          : {};
      if (detail.trigger instanceof HTMLButtonElement) triggerRef.current = detail.trigger;
      setIsOpen(true);
      window.dispatchEvent(new CustomEvent("site:menu-state", { detail: { open: true } }));
    }

    window.addEventListener("site:menu-open", handleMenuOpen);
    return () => window.removeEventListener("site:menu-open", handleMenuOpen);
  }, []);

  return (
    <>
      <nav
        className={`movil-menu${isOpen ? " abierto" : ""}`}
        id="menuMovil"
        aria-label={labels.mobileMenu}
        aria-hidden={!isOpen}
        inert={!isOpen}
        ref={menuRef}
        onKeyDown={handleMenuKeyDown}
        onClick={handleMenuClick}
      >
        <button
          className="cerrar"
          type="button"
          aria-label={labels.menuClose}
          ref={closeButtonRef}
          onClick={() => closeMenu()}
        >
          ×
        </button>
        {mobileContent}
      </nav>

      <nav
        ref={stickyNavRef}
        className={`sticky-nav${stickyVisible ? " visible" : ""}`}
        aria-label={labels.mainNavigation}
        aria-hidden={!stickyVisible}
        inert={!stickyVisible}
      >
        <div className="inner">
          {stickyContent}
        </div>
      </nav>

    </>
  );
}
