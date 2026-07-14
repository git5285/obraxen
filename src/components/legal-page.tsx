import type { ReactNode } from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";

type LegalPageProps = {
  title: string;
  intro: string;
  children: ReactNode;
  relatedHref: string;
  relatedLabel: string;
};

export function LegalPage({
  title,
  intro,
  children,
  relatedHref,
  relatedLabel,
}: LegalPageProps) {
  return (
    <>
      <nav className="legal-nav" aria-label="Navegación legal">
        <div>
          <Link href="/">{brand.claim}</Link>
          <Link className="volver" href="/">Volver a la web</Link>
        </div>
      </nav>
      <main>
        <p className="estado">Borrador incompleto · no apto para publicación</p>
        <h1>{title}</h1>
        <p className="intro">{intro}</p>
        {children}
        <footer>
          Última revisión del borrador: 14 de julio de 2026 ·{" "}
          <Link href={relatedHref}>{relatedLabel}</Link>
        </footer>
      </main>
    </>
  );
}
