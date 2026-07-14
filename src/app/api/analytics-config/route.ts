import { resolveAnalyticsConfig } from "@/lib/analytics-config";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(resolveAnalyticsConfig(process.env), {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
