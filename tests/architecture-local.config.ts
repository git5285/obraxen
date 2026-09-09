import { defineConfig } from "@playwright/test";

// Local-only route: reuse a disposable local browser; never start a production build.
export default defineConfig({
  testDir: ".",
  testMatch: "architecture-interaction.spec.ts",
  outputDir: process.env.ARCHITECTURE_OUTPUT_DIR,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: "line",
});
