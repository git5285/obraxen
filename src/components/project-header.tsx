import { brand } from "@/lib/brand";
import { LogoMark } from "./logo-mark";

type ProjectHeaderProps = {
  variant: "projects" | "case";
};

export function ProjectHeader({ variant }: ProjectHeaderProps) {
  const isHub = variant === "projects";
  return (
    <header className={`${variant}-header`}>
      <nav
        className={`${variant}-nav`}
        aria-label={isHub ? "Navegación de proyectos" : "Navegación del caso"}
      >
        <LogoMark brandName={brand.nombre} href="/" />
        <a className="back-link" href={isHub ? "/" : "/proyectos/"}>
          {isHub ? "Volver a la web" : "Todos los proyectos"}{" "}
          <span aria-hidden="true">→</span>
        </a>
      </nav>
    </header>
  );
}
