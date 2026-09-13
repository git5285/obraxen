import type { NextConfig } from "next";

const securityHeaders = [
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
  experimental: {
    cssChunking: "graph",
    globalNotFound: true,
  },
  images: {
    qualities: [60, 75],
  },
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
