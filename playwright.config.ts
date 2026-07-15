import { defineConfig } from "@playwright/test";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
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
    baseURL: "http://127.0.0.1:3000",
    colorScheme: "light",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
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
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3000",
    env: {
      GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID ?? "G-TEST123456",
      CLARITY_PROJECT_ID: process.env.CLARITY_PROJECT_ID ?? "testclarity1",
    },
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
