import { brand } from "@/lib/brand";

type ProjectFooterProps = {
  variant: "projects" | "case";
};

export function ProjectFooter({ variant }: ProjectFooterProps) {
  return (
    <footer className={`${variant}-footer`}>
      <div className={`${variant}-wrap`}>
        <p>
          {brand.nombre
            ? `© 2026 ${brand.nombre}. Todos los derechos reservados.`
            : "Reparación y tratamiento técnico de pavimentos industriales."}
        </p>
        <p>
          {brand.legalUrl ? <a href={brand.legalUrl}>Aviso legal</a> : null}
          {brand.legalUrl && brand.privacidadUrl ? " · " : null}
          {brand.privacidadUrl ? <a href={brand.privacidadUrl}>Privacidad</a> : null}
          {brand.legalUrl || brand.privacidadUrl ? " · " : null}
          <a href="/cookies/">Cookies</a>
        </p>
      </div>
    </footer>
  );
}
