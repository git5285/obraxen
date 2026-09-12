import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/internal-projects.ts",
        "src/lib/consent-providers.ts",
        "src/lib/consent-storage.ts",
        "src/lib/use-consent-controller.ts",
        "src/lib/project-jsonld.ts",
        "src/lib/project-metadata.ts",
        "src/lib/project-presenters.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 65,
        statements: 70,
        branches: 55,
      },
    },
  },
});
