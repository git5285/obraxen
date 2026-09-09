import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.clarity.ms; script-src-attr 'none'; style-src 'self'; font-src 'self'; img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; frame-ancestors 'none'; manifest-src 'self'; upgrade-insecure-requests",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), attribution-reporting=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  async redirects() {
    return [
      { source: "/", destination: "/es/", permanent: true },
      { source: "/proyectos", destination: "/es/proyectos/", permanent: true },
      { source: "/proyectos/:slug", destination: "/es/proyectos/:slug/", permanent: true },
      { source: "/aviso-legal", destination: "/es/aviso-legal/", permanent: true },
      { source: "/privacidad", destination: "/es/privacidad/", permanent: true },
      { source: "/cookies", destination: "/es/cookies/", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
