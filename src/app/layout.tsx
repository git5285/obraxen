import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { brand } from "@/lib/brand";
import { getPublicationState } from "@/lib/publication";
import "./globals.css";

const publication = getPublicationState(brand);

export const metadata: Metadata = {
  title: brand.nombre ? `${brand.nombre} — ${brand.claim}` : brand.claim,
  description:
    "Reparación de pavimentos industriales: juntas, fisuras, recrecidos y tratamientos superficiales. Intervenciones planificadas para reducir el impacto en la actividad.",
  robots: publication.isPublic
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  ...(brand.dominio
    ? { metadataBase: new URL(`https://${brand.dominio}`) }
    : {}),
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23EA580C'/%3E%3Cpath d='M6 21l6-5 4 3 7-7' stroke='white' stroke-width='3.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
