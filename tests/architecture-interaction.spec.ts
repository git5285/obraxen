import { test as base, expect, chromium, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Private development route: intentionally outside the production E2E suite.
// Run with a local agent-browser CDP endpoint and a config selecting this file.
const test = base.extend({
  browser: async ({}, provideBrowser) => {
    const endpoint = process.env.ARCHITECTURE_CDP;
    if (!endpoint || !["localhost", "127.0.0.1"].includes(new URL(endpoint).hostname)) {
      throw new Error("ARCHITECTURE_CDP must point to a local disposable browser");
    }
    const browser = await chromium.connectOverCDP(endpoint);
    await provideBrowser(browser);
    await browser.close();
  },
});

const url = "http://127.0.0.1:3011/es/architecture-preview/";

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
}

for (const width of [320, 390, 1440]) {
  test(`private contact route is clear and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [], posts: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (request.method() === "POST" && !request.url().includes("/__nextjs_")) posts.push(request.url()); });

    await page.goto(url);
    await expect(page.locator(".ar-contact-form")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Cuéntanos tu proyecto" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Escribir por correo", exact: true })).toHaveAttribute("href", /^mailto:/);
    await expect(page.getByRole("link", { name: "Abrir formulario de contacto", exact: true })).toHaveAttribute("href", "/es/contacto/");
    await expect(page.getByText("Si el formulario no está disponible", { exact: false })).toBeVisible();
    for (const link of await page.locator(".ar-solution-consult").all()) {
      await expect(link).toHaveAttribute("href", "/es/contacto/");
      await expect(link).not.toHaveAttribute("aria-current");
    }
    if (width === 320) expect((await new AxeBuilder({ page }).include("#contact").analyze()).violations).toEqual([]);
    await noOverflow(page);
    expect(errors).toEqual([]); expect(posts).toEqual([]);
  });
}

test("mobile menu names its state and solution details remain keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(url);
  const menu = page.locator(".ar-mobile-menu");
  const trigger = menu.locator("summary");
  await expect(trigger).toHaveAttribute("aria-label", "Abrir menú de navegación");
  await trigger.focus(); await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("open", "");
  await expect(trigger).toHaveAttribute("aria-label", "Cerrar menú de navegación");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");

  const first = page.locator(".ar-solution").first().locator("summary");
  await first.focus(); await page.keyboard.press("Enter");
  await expect(first.locator("xpath=..")).toHaveAttribute("open", "");
  await first.focus(); await page.keyboard.press("Enter");
  await expect(first.locator("xpath=..")).not.toHaveAttribute("open", "");
});
