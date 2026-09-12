import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../../../css/architecture-precision.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Obraxen | Precisión industrial, alternativa local",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PrecisionPreview({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "es" || process.env.NODE_ENV !== "development"
    || process.env.OBRAXEN_ARCHITECTURE_PREVIEW !== "local-only" || process.env.VERCEL) notFound();

  // The local alternative remains useful for layout review, but redacted
  // project records and image bytes must not be reintroduced here.
  const { ArchitecturePrecision } = await import("@/components/architecture-precision");
  return <ArchitecturePrecision projects={[]} />;
}
