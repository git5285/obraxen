import { fileURLToPath } from 'node:url';

// Use the repository's pinned dependencies without copying node_modules.
const root = fileURLToPath(new URL('../../', import.meta.url));
const nextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
  devIndicators: false,
};
export default nextConfig;
