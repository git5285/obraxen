import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const projects = JSON.parse(
  readFileSync(new URL("../../data/proyectos.json", import.meta.url), "utf8"),
) as Array<{ slug: string; imagenes: Array<unknown> }>;

const contentRoutes = [
  { path: "/", images: 24 },
  { path: "/proyectos/", images: 18 },
  ...projects.map((project) => ({
    path: `/proyectos/${project.slug}/`,
    images: project.imagenes.length,
  })),
];

for (const route of contentRoutes) {
  test(`${route.path} renders without browser or network errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      if (["document", "script", "stylesheet", "image"].includes(request.resourceType())) {
        failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
      }
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
  });
}

for (const path of ["/", "/proyectos/", "/proyectos/blitz-bremen/"]) {
  test(`${path} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      // Identificador visual de expediente: está oculto del árbol accesible y
      // su contraste depende de la fotografía de fondo ya cargada.
      .exclude(".reference-mark")
      .analyze();
    const blockingViolations = results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    );
    expect(blockingViolations).toEqual([]);
  });
}

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

  const response = await page.goto("/", { waitUntil: "networkidle" });
  const headers = response?.headers() ?? {};
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("style-src 'self'");
  expect(headers["content-security-policy"]).not.toContain("style-src 'self' 'unsafe-inline'");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
