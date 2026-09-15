import type { Metadata } from "next";
import "../../../../css/architecture.css";
import { ArchitectureSolutionsPage } from "@/components/architecture-solutions-page";
import { brand } from "@/lib/brand";
import { absoluteSiteUrl } from "@/lib/metadata";

const path = "/es/soluciones/";
const url = brand.dominio ? absoluteSiteUrl(brand.dominio, path) : undefined;

export const metadata: Metadata = {
  title: "Soluciones | Obraxen",
  description: "Soluciones para reparar, nivelar, rehabilitar y preparar pavimentos industriales.",
  alternates: url ? { canonical: url } : undefined,
  openGraph: { title: "Soluciones | Obraxen", description: "Soluciones para reparar, nivelar, rehabilitar y preparar pavimentos industriales.", type: "website", locale: "es_ES", url },
};

export default function SpanishSolutionsPage() {
  return <ArchitectureSolutionsPage />;
}
