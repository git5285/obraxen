import { resolveRuntimeConfig } from "@/lib/runtime-config";

// Este endpoint conserva los IDs del build, mientras el layout localizado
// consulta disponibilidad en runtime (force-dynamic). No son el mismo snapshot:
// cambiar IDs requiere reconstruir y mantener alineado el entorno de ejecución.
// Unificar ambos tiempos de lectura sería un cambio funcional independiente.
export const dynamic = "force-static";

export function GET(): Response {
  return Response.json(resolveRuntimeConfig().analytics, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
