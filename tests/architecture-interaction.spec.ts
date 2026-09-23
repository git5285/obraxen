import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = process.env.ARCHITECTURE_URL ?? "http://127.0.0.1:3012/es/soluciones/";

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
}

for (const width of [320, 390, 1440]) {
  test(`restored local contact review is clear and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [], posts: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (request.method() === "POST" && !request.url().includes("/__nextjs_")) posts.push(request.url()); });

    await page.goto(url);
    const consentChoice = page.locator(".consent-actions .consent-choice").first();
    if (await consentChoice.isVisible()) await consentChoice.click();
    const form = page.locator(".ar-contact-form");
    await expect(form).toHaveAttribute("data-state", "idle");
    await expect(form).toHaveAccessibleName("Formulario de contacto");
    const languageMenu = page.locator(".ar-language-menu");
    await expect(languageMenu.locator("summary")).toHaveAttribute("aria-label", "ES · Seleccionar idioma");
    await languageMenu.locator("summary").click();
    await expect(languageMenu).toHaveAttribute("open", "");
    await expect(languageMenu.locator(".ar-language-panel")).toBeVisible();
    await expect(languageMenu).toContainText("No disponible");
    await page.keyboard.press("Escape");
    await expect(languageMenu).not.toHaveAttribute("open", "");
    await expect(page.getByRole("heading", { name: "Cuéntanos tu caso", exact: true })).toBeVisible();
    await expect(page.locator("#contact .ar-demo-notice")).toHaveCount(0);
    await expect(page.getByLabel("Contacto directo alternativo").getByRole("link")).toHaveCount(0);
    await expect(page.getByLabel("Contacto directo alternativo")).toContainText("Contacto directo pendiente de validación.");
    await expect(form.locator(".ar-form-support .ar-contact-direct")).toHaveCount(1);
    const firstSolution = page.locator(".ar-solution-consult").first();
    await firstSolution.click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(firstSolution).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".ar-selected-solution strong")).toContainText("Reparación de pavimentos");
    await page.getByRole("button", { name: "Preparar consulta", exact: true }).click();
    await expect(page.locator("#ar-name-error")).toBeVisible();
    await page.locator("#ar-name").fill("Ejemplo ficticio");
    await page.locator("#ar-contact").fill("demo@example.invalid");
    await page.locator("#ar-need").fill("Revisión de una junta deteriorada en una nave industrial.");
    await page.getByRole("button", { name: "Preparar consulta", exact: true }).click();
    await expect(page.locator(".ar-review")).toContainText("Consulta preparada");
    await expect(page.getByRole("link", { name: "Enviar por WhatsApp", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Enviar por correo", exact: true })).toHaveCount(0);
    await expect(page.locator(".ar-review")).toContainText("Los canales de envío están pendientes de validación.");
    if (width < 700) await expect(page.locator(".ar-solution-photo")).toHaveCount(16);
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

  const first = page.locator(".ar-solution-dossier").first().locator("summary");
  await first.focus(); await page.keyboard.press("Enter");
  await expect(first.locator("xpath=..")).toHaveAttribute("open", "");
  await first.focus(); await page.keyboard.press("Enter");
  await expect(first.locator("xpath=..")).not.toHaveAttribute("open", "");
});
