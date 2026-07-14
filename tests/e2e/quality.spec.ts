import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const projects = JSON.parse(
  readFileSync(new URL("../../data/proyectos.json", import.meta.url), "utf8"),
) as Array<{ slug: string; imagenes: Array<unknown> }>;

const contentRoutes = [
  { path: "/", images: 24 },
  { path: "/proyectos/", images: 18 },
  { path: "/aviso-legal/", images: 0 },
  { path: "/cookies/", images: 0 },
  { path: "/privacidad/", images: 0 },
  ...projects.map((project) => ({
    path: `/proyectos/${project.slug}/`,
    images: project.imagenes.length,
  })),
];

for (const route of contentRoutes) {
  test(`${route.path} renders without browser or network errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    const thirdPartyRequests: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      if (["document", "script", "stylesheet", "image"].includes(request.resourceType())) {
        failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
      }
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) thirdPartyRequests.push(request.url());
    });

    const response = await page.goto(route.path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("img")).toHaveCount(route.images);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);

    const pageState = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      brokenImages: [...document.querySelectorAll<HTMLImageElement>("img")]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      temporaryNamePresent: document.body.textContent?.includes("RemainOn") ?? false,
    }));

    expect(pageState.overflow).toBe(false);
    expect(pageState.brokenImages).toEqual([]);
    expect(pageState.temporaryNamePresent).toBe(false);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(thirdPartyRequests).toEqual([]);
  });
}

for (const path of [
  "/",
  "/proyectos/",
  "/proyectos/blitz-bremen/",
  "/aviso-legal/",
  "/cookies/",
  "/privacidad/",
]) {
  test(`${path} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    const blockingViolations = results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    );
    expect(blockingViolations).toEqual([]);
  });
}

test("homepage project links satisfy WCAG 2.5.3 label in name", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "La regla no depende del viewport");
  await page.goto("/", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("rejecting analytics persists the choice and makes zero analytics requests", async ({ page }) => {
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

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-consent-banner]"))
    .toContainText("Tú decides si activamos la medición.");
  expect(analyticsRequests).toEqual([]);

  await page.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect(page.getByRole("button", { name: "Preferencias de privacidad" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(
    localStorage.getItem("site_privacy_preferences") ?? "null",
  ))).toMatchObject({ version: 1, analytics: false });

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("[data-consent-banner]")).toHaveCount(0);
  expect(analyticsRequests).toEqual([]);
});

test("analytics providers load only after acceptance and stop after revocation", async ({ page }) => {
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

  await page.goto("/", { waitUntil: "networkidle" });
  expect(analyticsRequests).toEqual([]);
  await page.getByRole("button", { name: "Aceptar analítica" }).click();

  await expect.poll(() => analyticsRequests.some((url) => url.includes("/api/analytics-config/")))
    .toBe(true);
  await expect.poll(() => analyticsRequests.some((url) => url.includes("googletagmanager.com")))
    .toBe(true);
  await expect.poll(() => analyticsRequests.some((url) => url.includes("clarity.ms")))
    .toBe(true);

  await page.getByRole("button", { name: "Preferencias de privacidad" }).click();
  const analyticsToggle = page.getByRole("checkbox", { name: /Analítica opcional/ });
  await expect(analyticsToggle).toBeChecked();
  await analyticsToggle.uncheck();
  const requestsBeforeRevocation = analyticsRequests.length;
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.getByRole("button", { name: "Guardar preferencias" }).click(),
  ]);

  expect(await page.evaluate(() => JSON.parse(
    localStorage.getItem("site_privacy_preferences") ?? "null",
  ))).toMatchObject({ analytics: false });
  await expect(page.locator("script[data-consent-provider]")) .toHaveCount(0);
  expect(analyticsRequests.slice(requestsBeforeRevocation)).toEqual([]);
});

test("privacy settings trap focus and return it to their trigger", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "La semántica no depende del viewport");
  await page.goto("/", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Configurar" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Configura la medición" });
  const close = dialog.getByRole("button", { name: "Cerrar preferencias de privacidad" });
  const lastButton = dialog.getByRole("button", { name: "Rechazar analítica" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("mobile menu traps and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Interacción exclusiva del viewport móvil");

  await page.goto("/", { waitUntil: "networkidle" });
  const trigger = page.locator(".hero .menu-btn");
  const menu = page.locator("#menuMovil");
  const close = menu.getByRole("button", { name: "Cerrar menú" });
  const lastLink = menu.getByRole("link", { name: "Ver proyectos" });

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(lastLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();

  await trigger.click();
  await menu.getByRole("link", { name: "Proceso", exact: true }).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#proceso")).toBeFocused();
});

test("closed routes, robots and security headers fail closed", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "La política HTTP no depende del viewport");
  const closedRoute = await request.get("/soluciones/");
  expect(closedRoute.status()).toBe(404);

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("<url>");

  const response = await page.goto("/", { waitUntil: "networkidle" });
  const headers = response?.headers() ?? {};
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["strict-transport-security"]).toBe("max-age=31536000");
  expect(headers["content-security-policy"]).toContain("style-src 'self'");
  expect(headers["content-security-policy"]).toContain("script-src-attr 'none'");
  expect(headers["content-security-policy"]).toContain("https://*.googletagmanager.com");
  expect(headers["content-security-policy"]).toContain("https://*.clarity.ms");
  expect(headers["content-security-policy"]).not.toContain("doubleclick.net");
  expect(headers["permissions-policy"]).toContain("browsing-topics=()");
  expect(headers["content-security-policy"]).not.toContain("style-src 'self' 'unsafe-inline'");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
