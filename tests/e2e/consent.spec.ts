import { expect, test } from "@playwright/test";

test("rejecting analytics persists the choice and makes zero analytics requests", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Consent behavior is viewport independent");
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === "/api/analytics-config/"
      || url.hostname.endsWith("google-analytics.com")
      || url.hostname.endsWith("googletagmanager.com")
      || url.hostname.endsWith("clarity.ms")
      || url.hostname === "c.bing.com"
    ) analyticsRequests.push(request.url());
  });

  await page.goto("/en/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-consent-banner]"))
    .toContainText("You decide whether measurement is enabled.");
  expect(analyticsRequests).toEqual([]);

  await page.getByRole("button", { name: "Reject analytics" }).click();
  await expect(page.getByRole("button", { name: "Privacy preferences" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(
    localStorage.getItem("site_privacy_preferences") ?? "null",
  ))).toMatchObject({ version: 1, analytics: false });

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("[data-consent-banner]")).toHaveCount(0);
  expect(analyticsRequests).toEqual([]);
});

test("analytics providers load only after acceptance and stop after revocation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Consent behavior is viewport independent");
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === "/api/analytics-config/"
      || url.hostname.endsWith("googletagmanager.com")
      || url.hostname.endsWith("clarity.ms")
    ) analyticsRequests.push(request.url());
  });
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "window.__gaConsentTestLoaded = true;",
  }));
  await page.route("https://www.clarity.ms/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "window.__clarityConsentTestLoaded = true;",
  }));

  await page.goto("/en/", { waitUntil: "networkidle" });
  expect(analyticsRequests).toEqual([]);
  await page.getByRole("button", { name: "Accept analytics" }).click();

  await expect.poll(() => analyticsRequests.some((url) => url.includes("/api/analytics-config/")))
    .toBe(true);
  await expect.poll(() => analyticsRequests.some((url) => url.includes("googletagmanager.com")))
    .toBe(true);
  await expect.poll(() => analyticsRequests.some((url) => url.includes("clarity.ms")))
    .toBe(true);

  await page.getByRole("button", { name: "Privacy preferences" }).click();
  const analyticsToggle = page.getByRole("checkbox", { name: /Optional analytics/ });
  await expect(analyticsToggle).toBeChecked();
  await analyticsToggle.uncheck();
  const requestsBeforeRevocation = analyticsRequests.length;
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.getByRole("button", { name: "Save preferences" }).click(),
  ]);

  expect(await page.evaluate(() => JSON.parse(
    localStorage.getItem("site_privacy_preferences") ?? "null",
  ))).toMatchObject({ analytics: false });
  await expect(page.locator("script[data-consent-provider]")).toHaveCount(0);
  expect(analyticsRequests.slice(requestsBeforeRevocation)).toEqual([]);
});

test("privacy settings trap focus and return it to their trigger", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "The semantics do not depend on viewport size");
  await page.goto("/en/", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Configure" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Configure measurement" });
  const close = dialog.getByRole("button", { name: "Close privacy preferences" });
  const lastButton = dialog.getByRole("button", { name: "Reject analytics" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
