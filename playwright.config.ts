import { defineConfig } from "@playwright/test";

const isCi = Boolean(process.env.CI);
const contactEnabled = process.env.CONTACT_E2E_ENABLED === "true";
const requestedPort = Number(process.env.QA_PORT);

if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65_535) {
  throw new Error("QA_PORT is required; run Playwright through npm run test:e2e");
}

const baseUrl = `http://127.0.0.1:${requestedPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: contactEnabled ? "contact-enabled.spec.ts" : "quality.spec.ts",
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: isCi
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: baseUrl,
    colorScheme: "light",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: contactEnabled ? [
    {
      name: "contact-enabled-chromium",
      use: { viewport: { width: 390, height: 844 } },
    },
  ] : [
    {
      name: "mobile-chromium",
      grepInvert: /WebKit smoke/,
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "desktop-chromium",
      grepInvert: /WebKit smoke/,
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "desktop-webkit",
      grep: /WebKit smoke/,
      use: { browserName: "webkit", viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${requestedPort}`,
    env: {
      GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID ?? "G-TEST123456",
      CLARITY_PROJECT_ID: process.env.CLARITY_PROJECT_ID ?? "testclarity1",
      ...(contactEnabled ? { QA_CONTACT_HARNESS: "local-playwright" } : {}),
    },
    url: baseUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
