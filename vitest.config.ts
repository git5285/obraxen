import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["domain/publication/**/*.ts", "domain/publication/**/*.mjs"],
      exclude: [
        "domain/publication/internal-projects.ts",
        "domain/publication/**/*.d.mts",
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
