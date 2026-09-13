import { resolveRuntimeConfig } from "@/lib/runtime-config";

// El layout localizado también es prerenderizado. Mantener este endpoint
// estático hace que ambos consuman el mismo snapshot de build; cualquier cambio
// de IDs exige reconstruir la candidata.
export const dynamic = "force-static";

export function GET(): Response {
  return Response.json(resolveRuntimeConfig().analytics, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
