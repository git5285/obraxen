import { expect, test } from "@playwright/test";

const navigationReady = "domcontentloaded" as const;
function isArchitectureHome(locale: { home: string }, route: string) {
  return locale.home === "/es/" && route === locale.home;
}

// Independent expectations: do not derive these URLs from production routing.
const locales = [{ home: "/en/" }, { home: "/de/" }, { home: "/es/" }, { home: "/fr/" }];

test("sticky navigation follows sections and hides again at the hero", async ({ page }) => {
  await page.goto("/en/");
  const sticky = page.locator(".sticky-nav");
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
  for (const section of ["services", "process"]) {
    await page.locator(`#${section}`).evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(sticky).toHaveAttribute("aria-hidden", "false");
    const active = sticky.locator(`[data-navigation-section="${section}"]`);
    await expect(active).toHaveAttribute("aria-current", "location");
    await expect(active).toHaveClass(/activo/);
    await expect(sticky.locator('[aria-current="location"]')).toHaveCount(1);
  }
  await page.locator(".hero").evaluate(element => element.scrollIntoView({ behavior: "instant" }));
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
  await expect(sticky).toHaveAttribute("inert", "");
});

test("mobile usability: short menus keep all links reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Explicit mobile viewport matrix");
  for (const locale of locales) {
    for (const viewport of [{ width: 667, height: 375 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(locale.home, { waitUntil: navigationReady });
      const reject = page.locator(".consent-actions .consent-choice").first();
      if (await reject.isVisible()) await reject.click();
      const architecture = isArchitectureHome(locale, locale.home);
      const trigger = architecture ? page.locator(".ar-mobile-menu > summary") : page.locator(".hero-nav .menu-btn");
      await trigger.click();
      const menu = architecture ? page.locator(".ar-mobile-menu nav") : page.locator(".movil-menu");
      await expect(menu).toBeVisible();
      const first = menu.locator(":scope > a").first();
      const firstBox = await first.boundingBox();
      expect(firstBox).not.toBeNull();
      expect(firstBox!.y).toBeGreaterThanOrEqual(72);
      for (const link of await menu.locator("a").all()) {
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      }
      await page.keyboard.press("Escape");
      if (architecture) await expect(page.locator(".ar-mobile-menu")).not.toHaveAttribute("open", "");
      else await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    }
  }
});

test("mobile menu traps and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only interaction");

  await page.goto("/en/", { waitUntil: "networkidle" });
  const trigger = page.locator(".hero .menu-btn");
  const menu = page.locator("#menuMovil");
  const close = menu.getByRole("button", { name: "Close menu" });
  const lastLink = menu.locator("a").last();

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
  await menu.getByRole("link", { name: "Process", exact: true }).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#process")).toBeFocused();
});
