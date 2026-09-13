import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import architectureHall from "../../../img/architecture-hall-illustrative.png";
import "../../../css/architecture.css";
import { ArchitectureHome } from "@/components/architecture-home";
import { brand } from "@/lib/brand";
import { getPath, openGraphLocales } from "@/lib/i18n";
import { absoluteSiteUrl } from "@/lib/metadata";

function getStaticImagePath(image: StaticImageData | string) {
  return typeof image === "string" ? image : image.src;
}

function getArchitectureProjects() {
  // Project records and photographs remain unpublished until their evidence,
  // permissions and professional review are complete.
  return [];
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
        name: brand.nombre ?? "Obraxen",
        url: siteUrl,
        ...(brand.email ? { email: brand.email } : {}),
        ...(brand.telefono ? { telephone: brand.telefono } : {}),
        ...(brand.direccion ? { address: { "@type": "PostalAddress", streetAddress: brand.direccion } } : {}),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: brand.nombre ?? "Obraxen",
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

export const dynamic = "force-dynamic";

export default function SpanishHomePage() {
  const jsonLd = getArchitectureJsonLd();
  return <>
    {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /> : null}
    <ArchitectureHome projects={getArchitectureProjects()} />
  </>;
}
