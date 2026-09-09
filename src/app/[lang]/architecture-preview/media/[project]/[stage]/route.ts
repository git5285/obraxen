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

  // Only an allowlisted record supplies a filename, and only after every gate.
  const { internalProjects } = await import("@/lib/internal-projects");
  const image = internalProjects.find(project => project.slug === slug)?.imagenes.find(
    image => image.etapa === (stage === "initial" ? "Estado inicial" : "Resultado documentado"),
  );
  if (!image) return unavailable();
  const { resolve, sep } = await import("node:path");
  const root = resolve(process.cwd(), "img/proyectos");
  const path = resolve(process.cwd(), image.src);
  if (!path.startsWith(`${root}${sep}`) || !path.endsWith(".webp")) return unavailable();
  const { readFile } = await import("node:fs/promises");
  try {
    const bytes = await readFile(path);
    return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch {
    return unavailable();
  }
}
