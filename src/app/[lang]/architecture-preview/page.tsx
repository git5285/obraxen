import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../../css/architecture.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Obraxen | Arquitectura, preview privada",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ArchitecturePreview({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams?: Promise<{ review?: string }> }) {
  const { lang } = await params;
  if (lang !== "es" || process.env.NODE_ENV !== "development"
    || process.env.OBRAXEN_ARCHITECTURE_PREVIEW !== "local-only" || process.env.VERCEL) notFound();
  // Keep the review route available for layout review, but do not load redacted
  // project records or create media URLs without approved evidence.
  const { ArchitectureHome } = await import("@/components/architecture-home");
  const review = (await searchParams)?.review === "editorial";
  return <ArchitectureHome projects={[]} showEditorialPreview={review} />;
}
