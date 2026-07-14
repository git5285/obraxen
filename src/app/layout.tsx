import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { brand } from "@/lib/brand";
import { getPublicationState } from "@/lib/publication";
import "./globals.css";

const publication = getPublicationState(brand);

export const metadata: Metadata = {
  title: brand.nombre ? `${brand.nombre} — ${brand.claim}` : brand.claim,
  description:
    "Fundación técnica de la migración progresiva del sitio de reparación de pavimentos industriales.",
  robots: publication.isPublic
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  ...(brand.dominio
    ? { metadataBase: new URL(`https://${brand.dominio}`) }
    : {}),
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
