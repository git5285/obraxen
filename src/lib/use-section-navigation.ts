"use client";

import { useEffect, useRef, useState } from "react";

export function useSectionNavigation(sectionIds: readonly string[]) {
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const stickyNavRef = useRef<HTMLElement>(null);

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
    for (const sectionId of sectionIds) {
      const section = document.getElementById(sectionId);
      if (section) sectionObserver.observe(section);
    }

    return () => {
      heroObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, [sectionIds]);

  useEffect(() => {
    const navigation = stickyNavRef.current;
    if (!navigation) return;

    for (const link of navigation.querySelectorAll<HTMLAnchorElement>("[data-navigation-section]")) {
      const active = link.dataset.navigationSection === activeSection;
      link.classList.toggle("activo", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }, [activeSection]);

  return { stickyVisible, stickyNavRef };
}
