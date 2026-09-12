export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = {
  "Cache-Control": "private, no-store, no-transform",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cross-Origin-Resource-Policy": "same-origin",
};
const unavailable = () => new Response(null, { status: 404, headers });

export async function GET(request: Request, { params }: { params: Promise<{ lang: string; project: string; stage: string }> }) {
  const { lang, project: slug, stage } = await params;
  if (lang !== "es" || process.env.NODE_ENV !== "development"
    || process.env.OBRAXEN_ARCHITECTURE_PREVIEW !== "local-only" || process.env.VERCEL
    || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)
    || !["delticom-hannover", "hologram-paris"].includes(slug)
    || !["initial", "result"].includes(stage)) return unavailable();

  // All project photographs were redacted. Keep the endpoint fail-closed until
  // a separately approved, documented asset set is available.
  return unavailable();
}
