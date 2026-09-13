import { resolveRuntimeConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export function GET(): Response {
  // Solo se expone el estado público de disponibilidad; nunca credenciales ni
  // buzones de entrega. La respuesta no debe cachearse entre configuraciones.
  return Response.json(
    { enabled: resolveRuntimeConfig().contact.enabled },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
