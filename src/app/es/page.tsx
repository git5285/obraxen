import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import delticomInitial from "../../../img/proyectos/delticom/estado-inicial.webp";
import delticomResult from "../../../img/proyectos/delticom/resultado.webp";
import hologramInitial from "../../../img/proyectos/hologram/estado-inicial-huecos.webp";
import hologramResult from "../../../img/proyectos/hologram/resultado.webp";
import architectureHall from "../../../img/architecture-hall-illustrative.png";
import "../../../css/architecture.css";
import { ArchitectureHome } from "@/components/architecture-home";
import { brand } from "@/lib/brand";
import { architectureCompany } from "@/lib/architecture-content";
import { getPath, openGraphLocales } from "@/lib/i18n";
import { internalProjects } from "@/lib/internal-projects";
import { absoluteSiteUrl } from "@/lib/metadata";

const architectureProjectImages = {
  "delticom-hannover": { initial: delticomInitial, result: delticomResult },
  "hologram-paris": { initial: hologramInitial, result: hologramResult },
};

function getStaticImagePath(image: StaticImageData | string) {
  return typeof image === "string" ? image : image.src;
}

function getArchitectureProjects() {
  return ["delticom-hannover", "hologram-paris"].map((slug) => {
    const project = internalProjects.find((item) => item.slug === slug);
    if (!project) throw new Error(`Falta el registro interno ${slug}`);
    const images = ["Estado inicial", "Resultado documentado"].map((stage) => {
      const image = project.imagenes.find((item) => item.etapa === stage);
      if (!image) throw new Error(`Falta la fotografía ${stage} de ${slug}`);
      const asset = architectureProjectImages[slug as keyof typeof architectureProjectImages][stage === "Estado inicial" ? "initial" : "result"];
      return { src: asset.src, alt: image.alt, stage, width: asset.width, height: asset.height };
    });
    return {
      name: project.cliente,
      city: project.ubicacion.ciudad,
      country: project.traducciones.es.pais,
      sector: project.traducciones.es.sector,
      area: project.superficieM2,
      description: project.traducciones.es.solucion,
      problem: project.traducciones.es.problema,
      result: project.traducciones.es.resultado,
      duration: project.traducciones.es.duracionReal,
      materials: project.traducciones.es.materiales,
      images,
    };
  });
}

const path = getPath("es", "home");
const url = brand.dominio ? absoluteSiteUrl(brand.dominio, path) : undefined;
const image = brand.dominio ? absoluteSiteUrl(brand.dominio, getStaticImagePath(architectureHall)) : undefined;
const siteUrl = brand.dominio ? absoluteSiteUrl(brand.dominio, "/") : undefined;

function getArchitectureJsonLd() {
  if (!url || !siteUrl) return null;

  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: architectureCompany.legalName,
        url: siteUrl,
        email: architectureCompany.email,
        telephone: architectureCompany.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: architectureCompany.address,
          addressLocality: "Málaga",
          addressCountry: "ES",
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: brand.nombre ?? architectureCompany.legalName,
        url: siteUrl,
        inLanguage: "es",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: "Obraxen | Reparación de pavimentos industriales",
        description: "Reparación y rehabilitación de pavimentos industriales.",
        inLanguage: "es",
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
      },
    ],
  }).replace(/</g, "\\u003c");
}

export const metadata: Metadata = {
  title: "Obraxen | Reparación de pavimentos industriales",
  description: "Reparación y rehabilitación de pavimentos industriales.",
  // This proposal only exists in Spanish. The language switcher deliberately
  // links to the current public site, which is not a translated equivalent.
  alternates: url ? { canonical: url } : undefined,
  openGraph: {
    title: "Obraxen | Reparación de pavimentos industriales",
    description: "Reparación y rehabilitación de pavimentos industriales.",
    type: "website",
    locale: openGraphLocales.es,
    siteName: brand.nombre ?? "Obraxen",
    url,
    ...(image ? { images: [{ url: image, alt: "Reparación de pavimentos industriales" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Obraxen | Reparación de pavimentos industriales",
    description: "Reparación y rehabilitación de pavimentos industriales.",
    ...(image ? { images: [image] } : {}),
  },
};

export default function SpanishHomePage() {
  const jsonLd = getArchitectureJsonLd();
  return <>
    {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /> : null}
    <ArchitectureHome projects={getArchitectureProjects()} />
  </>;
}
