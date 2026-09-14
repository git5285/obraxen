import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Local-only prototype checks; never follow outgoing contact links.
const url = process.env.ARCHITECTURE_URL ?? "http://127.0.0.1:3012/es/";
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname)) throw new Error("Local preview URL required");

for (const width of [320, 390, 701, 1440]) {
  test(`four priorities preserve the complete local flow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [], posts: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", async route => {
      const request = route.request();
      if (request.method() === "POST" && !request.url().includes("/__nextjs_")) {
        posts.push(request.url());
        return route.abort();
      }
      if (!["127.0.0.1", "localhost"].includes(new URL(request.url()).hostname)) return route.abort();
      await route.continue();
    });
    await page.goto(url);
    await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
    const language = page.locator(".ar-language-menu");
    await language.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(language).toHaveAttribute("open", "");
    await expect(language.locator("nav a")).toHaveCount(1);
    await expect(language.locator(".ar-language-unavailable")).toHaveCount(3);
    await expect(language).toContainText("Esta versión está disponible en español.");
    for (const code of ["en", "de", "fr"]) await expect(page.locator(`a[href="/${code}/"]`)).toHaveCount(0);
    const panel = await language.locator(".ar-language-panel").boundingBox();
    expect(panel!.x).toBeGreaterThanOrEqual(0);
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(language).not.toHaveAttribute("open", "");
    await expect(language.locator("summary")).toBeFocused();

    const cards = page.locator(".ar-solution");
    await expect(cards).toHaveCount(4);
    const heights = await cards.evaluateAll(elements => elements.map(e => e.getBoundingClientRect().height));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
    if (width === 390) expect(heights[0]).toBeLessThan(390);
    if (width === 320) expect(heights[0]).toBeLessThan(350);
    for (const card of await cards.all()) {
      const photos = card.locator(".ar-solution-photos img");
      await expect(photos).toHaveCount(4);
      await card.scrollIntoViewIfNeeded();
      await expect.poll(() => photos.evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
    }
    const details = page.locator(".ar-solution-details");
    const top = () => cards.nth(1).locator("summary").evaluate(e => e.getBoundingClientRect().top + scrollY);
    const before = await top();
    await details.nth(0).locator("summary").click();
    if (width > 700) expect(Math.abs(await top() - before)).toBeLessThan(1);
    await details.nth(2).locator("summary").scrollIntoViewIfNeeded();
    const scroll = await page.evaluate(() => scrollY);
    await details.nth(2).locator("summary").click();
    await expect(page.locator(".ar-solution-details[open]")).toHaveCount(2);
    expect(Math.abs(await page.evaluate(() => scrollY) - scroll)).toBeLessThan(2);
    for (const index of [0, 2]) await details.nth(index).locator("summary").click();
    for (const card of await page.locator(".ar-project-compact").all()) {
      await expect(card.locator(".ar-case-attribution")).toBeVisible();
      await expect(card.locator(".ar-case-full")).not.toHaveAttribute("open", "");
      const locationBox = await card.locator(".ar-case-location").boundingBox();
      const attributionBox = await card.locator(".ar-case-attribution").boundingBox();
      // Firefox can report 3.99988px for a 4px gap at fractional coordinates.
      expect(attributionBox!.y - locationBox!.y - locationBox!.height).toBeGreaterThanOrEqual(3.9);
    }
    const caseHeights = await page.locator(".ar-project-compact").evaluateAll(elements => elements.map(e => e.getBoundingClientRect().height));
    if (width > 700) expect(Math.max(...caseHeights) - Math.min(...caseHeights)).toBeLessThan(1);

    await cards.first().locator(".ar-solution-consult").click();
    const send = page.getByRole("button", { name: "Enviar consulta", exact: true });
    await expect(page.locator("#ar-send-help")).toBeVisible();
    await expect(send).toHaveAttribute("aria-describedby", "ar-send-help");
    await send.click();
    await expect(page.locator("#ar-name")).toBeFocused();
    await page.locator("#ar-name").fill("Prueba local");
    await page.locator("#ar-contact").fill("prueba@example.invalid");
    await page.locator("#ar-need").fill("Revisión de una junta deteriorada en una nave industrial.");
    await send.click();
    await expect(page.locator(".ar-review")).toContainText("Todavía no se ha enviado.");
    await expect(page.locator(".ar-review")).toBeFocused();
    await expect(page.locator(".ar-review a[href^='mailto:']")).toHaveAttribute("href", /prueba%40example.invalid/);
    await expect(page.locator(".ar-review a[href^='https://wa.me/']")).toHaveCount(1);
    await page.getByRole("button", { name: "Editar consulta" }).click();
    await expect(page.locator("#ar-name")).toHaveValue("Prueba local");
    await page.getByRole("button", { name: "Borrar", exact: true }).click();
    await expect(page.locator("#ar-name")).toHaveValue("");
    const violations = (await new AxeBuilder({ page }).include(".ar-home").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations;
    expect(violations).toEqual([]);
    if ([390, 1440].includes(width) && testInfo.project.name === "chromium") {
      for (const selector of ["#services", "#projects", "#contact"]) {
        await page.locator(selector).evaluate(element => window.scrollTo({ top: Math.max(0, element.getBoundingClientRect().top + scrollY - 100), behavior: "instant" }));
        await page.screenshot({ path: testInfo.outputPath(`${selector.slice(1)}-${width}.png`) });
      }
    }
    await page.addStyleTag({ content: "html{font-size:200%!important}body{font-family:Verdana,sans-serif!important}" });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await language.locator("summary").click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    expect(errors).toEqual([]);
    expect(posts).toEqual([]);
  });
}
