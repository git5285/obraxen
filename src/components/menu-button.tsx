"use client";

import { useEffect, useState } from "react";

export function MenuButton({ label }: { label: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleMenuState(event: Event) {
      const detail =
        event instanceof CustomEvent && event.detail && typeof event.detail === "object"
          ? (event.detail as { open?: unknown })
          : {};
      setIsOpen(detail.open === true);
    }

    window.addEventListener("site:menu-state", handleMenuState);
    return () => window.removeEventListener("site:menu-state", handleMenuState);
  }, []);

  return (
    <button
      className="menu-btn"
      type="button"
      aria-label={label}
      aria-controls="menuMovil"
      aria-expanded={isOpen}
      onClick={(event) => {
        window.dispatchEvent(
          new CustomEvent("site:menu-open", { detail: { trigger: event.currentTarget } }),
        );
      }}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
