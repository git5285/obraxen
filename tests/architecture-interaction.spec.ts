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
const values = { name: "Ejemplo ficticio", contact: "demo@example.invalid", need: "Revisión de una junta. ".repeat(50) };

async function fillExample(page: Page) {
  for (const [id, value] of Object.entries(values)) await page.locator(`#ar-${id}`).fill(value);
}
async function submitWithKeyboard(page: Page) {
  await page.getByRole("button", { name: "Revisar ejemplo", exact: true }).focus();
  await page.keyboard.press("Enter");
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
}
async function captureState(page: Page, selector: string, path: string) {
  await expect(page.locator(selector)).toBeInViewport();
  await page.locator(selector).evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.screenshot({ path });
}

for (const width of [320, 390, 1440]) for (const motion of ["reduce", "no-preference"] as const) {
  test(`local review ${width}px / ${motion}: keyboard, error, result and recovery`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: motion });
    const errors: string[] = [], failed: string[] = [], posts: string[] = [], devWarnings: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (text.includes("React requires eval() in development mode") || text.includes("Applying inline style violates")) devWarnings.push(text);
      else errors.push(text);
    });
    page.on("requestfailed", request => failed.push(request.url()));
    page.on("request", request => { if (request.method() === "POST" && !request.url().includes("/__nextjs_")) posts.push(request.url()); });
    await page.goto(url);
    const form = page.locator(".ar-contact-form"), status = form.locator(".ar-form-status");
    await expect(form).toHaveAttribute("data-state", "idle");
    await expect(status).toContainText("Revisión local sin envío");
    await page.evaluate(() => document.fonts.ready);

    const reviewButton = page.getByRole("button", { name: "Revisar ejemplo", exact: true });
    await reviewButton.focus();
    const restingBackground = await reviewButton.evaluate(e => getComputedStyle(e).backgroundColor);
    await page.keyboard.down("Space");
    expect(await reviewButton.evaluate(e => e.matches(":active"))).toBe(true);
    expect(await reviewButton.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(restingBackground);
    await page.keyboard.up("Space");
    await expect(page.locator("#ar-name")).toBeFocused();
    await expect(page.locator("#ar-name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#ar-name")).toHaveAttribute("aria-describedby", "ar-name-error");
    await expect(page.locator("#ar-name-error")).toHaveText("Escribe tu nombre.");
    await expect(status).toContainText("Corrige el campo indicado");
    await page.keyboard.press("Tab");
    await expect(page.locator("#ar-contact")).toBeFocused();
    await expect(page.locator("#ar-name-error")).toBeVisible();
    await page.keyboard.press("Shift+Tab");
    expect(await page.locator("#ar-name").evaluate(e => e.matches(":focus-visible") && getComputedStyle(e).outlineStyle !== "none")).toBe(true);
    await captureState(page, "#ar-name-error", testInfo.outputPath("error.png"));
    await noOverflow(page);
    if (width === 320 && motion === "reduce") expect((await new AxeBuilder({ page }).include(".ar-contact-form").analyze()).violations).toEqual([]);

    await fillExample(page);
    await page.locator("#ar-contact").fill("correo-invalido");
    await submitWithKeyboard(page);
    await expect(page.locator("#ar-contact-error")).toHaveText("Escribe un email o teléfono válido.");
    await expect(page.locator("#ar-need")).toHaveValue(values.need);
    await page.locator("#ar-name").fill("Otro nombre");
    await expect(page.locator("#ar-contact-error")).toBeVisible();
    await page.locator("#ar-contact").fill("");
    await submitWithKeyboard(page);
    await expect(page.locator("#ar-contact-error")).toContainText("email o teléfono");
    await page.locator("#ar-contact").fill("+34 600 123 456");
    await expect(page.locator("#ar-contact-error")).toHaveCount(0);
    await submitWithKeyboard(page);
    await expect(page.locator(".ar-review")).toBeFocused();
    await expect(page.locator(".ar-review")).toContainText(values.need.trim());
    await expect(status).toContainText("no se ha enviado");
    await captureState(page, "#ar-review-heading", testInfo.outputPath("result.png"));
    await noOverflow(page);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Editar consulta" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#ar-name")).toBeFocused();
    await expect(page.locator("#ar-need")).toHaveValue(values.need);
    await expect(status).toContainText("actualizar el resumen");

    await submitWithKeyboard(page);
    await expect(page.locator(".ar-review")).toBeFocused();
    await submitWithKeyboard(page); // Repeated action keeps a single current result.
    await expect(page.locator(".ar-review")).toHaveCount(1);
    await expect(page.locator(".ar-review")).toBeFocused();

    await page.getByRole("button", { name: "Borrar", exact: true }).focus();await page.keyboard.press("Space");
    await expect(form).toHaveAttribute("data-state", "cleared");
    await expect(status).toContainText("Formulario borrado");
    await expect(page.locator(".ar-review")).toHaveCount(0);
    await expect(page.locator("#ar-name")).toHaveValue("");
    await expect(form.locator("[aria-invalid=true]")).toHaveCount(0);
    await captureState(page, ".ar-form-status", testInfo.outputPath("cleared.png"));
    await noOverflow(page);
    await fillExample(page);
    // Synthetic same-tick actions verify that reset wins, with no deferred focus.
    await form.evaluate(element => {
      const form = element as HTMLFormElement;
      form.requestSubmit();
      form.reset();
      form.querySelector<HTMLInputElement>("#ar-contact")!.focus();
    });
    await expect(form).toHaveAttribute("data-state", "cleared");
    await expect(page.locator(".ar-review")).toHaveCount(0);
    await expect(page.locator("#ar-contact")).toBeFocused();
    const animations = await form.evaluate(e => e.getAnimations({ subtree: true }).length);
    expect(animations).toBe(0);
    if (motion === "reduce") expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    await testInfo.attach("browser-observations", { body: JSON.stringify({ errors, failed, posts, knownDevWarnings: [...new Set(devWarnings)], animations }), contentType: "application/json" });
    expect(errors).toEqual([]);expect(failed).toEqual([]);expect(posts).toEqual([]);
  });
}

test("preparation is visible while JavaScript is delayed; typed values survive hydration", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/_next\/.*\.js(?:\?.*)?$/, async route => { await gate;await route.continue(); });
  try {
    await page.goto(url, { waitUntil: "commit" });
    await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "preparing");
    await expect(page.getByRole("button", { name: "Revisar ejemplo" })).toBeDisabled();
    await expect(page.locator(".ar-form-status")).toContainText("Preparando la revisión local");
    await page.locator("#ar-name").fill("Escrito antes de activar");
    release();
    await expect(page.getByRole("button", { name: "Revisar ejemplo" })).toBeEnabled();
    await expect(page.locator("#ar-name")).toHaveValue("Escrito antes de activar");
  } finally { release(); }
});

test("without JavaScript the demo cannot submit and explains alternatives", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.getByRole("button", { name: "Revisar ejemplo" })).toBeDisabled();
  await expect(page.locator(".ar-form-status")).toContainText("utiliza los enlaces de contacto");
  await expect(page.getByRole("link", { name: "Escribir por correo", exact: true })).toHaveAttribute("href", /^mailto:/);
  await context.close();
});

for (const width of [320, 390, 768, 1440]) {
  test(`solution context and documented cases at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url);
    await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
    const cards = page.locator(".ar-solution");
    await expect(cards).toHaveCount(4);
    for (const card of await cards.all()) {
      await expect(card.locator("img")).toHaveCount(4);
      await expect(card.locator(".ar-solution-need")).toBeVisible();
    }
    const neighborBefore = await cards.nth(1).boundingBox();
    const scrollBefore = await page.evaluate(() => scrollY);
    const selectedBefore = await cards.first().boundingBox();
    await cards.first().locator("summary").click();
    await expect(cards.first().locator("details")).toHaveAttribute("open", "");
    const neighborAfter = await cards.nth(1).boundingBox();
    expect(neighborAfter!.height).toBeCloseTo(neighborBefore!.height, 0);
    expect((await cards.first().boundingBox())!.height).toBeGreaterThan(selectedBefore!.height);
    if (width > 700) {
      const scrollAfter = await page.evaluate(() => scrollY);
      expect(neighborAfter!.y + scrollAfter).toBeCloseTo(neighborBefore!.y + scrollBefore, 0);
    }
    await expect(cards.nth(1).locator("details")).not.toHaveAttribute("open", "");
    await cards.first().locator("summary").click();
    for (let selected = 1; selected < 4; selected++) {
      const before = await Promise.all((await cards.all()).map(card => card.boundingBox()));
      await cards.nth(selected).locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(cards.nth(selected).locator("details")).toHaveAttribute("open", "");
      for (let other = 0; other < 4; other++) {
        if (other === selected) continue;
        expect((await cards.nth(other).boundingBox())!.height).toBeCloseTo(before[other]!.height, 0);
        await expect(cards.nth(other).locator("details")).not.toHaveAttribute("open", "");
      }
      await page.keyboard.press("Enter");
      await expect(cards.nth(selected).locator("details")).not.toHaveAttribute("open", "");
    }
    const sectorGallery = page.locator(".ar-sector-gallery");
    await expect(sectorGallery.locator("h3")).toHaveText(["Logística", "Industria", "Automoción", "Distribución", "Alimentación", "Aparcamientos"]);
    const sectorSources = await sectorGallery.locator("img").evaluateAll(images => images.map(image => image.getAttribute("src")));
    expect(new Set(sectorSources).size).toBe(6);
    for (const card of await page.locator(".ar-project-compact").all()) {
      await expect(card.locator(".ar-case-summary strong")).toHaveText(["Problema", "Intervención", "Resultado documentado"]);
      await expect(card.locator(".ar-case-full")).not.toHaveAttribute("open", "");
    }
    await fillExample(page);
    for (const link of await page.locator(".ar-solution-consult").all()) {
      const title = (await link.getAttribute("aria-label"))!.replace("Consultar esta solución: ", "");
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#contact$/);
      await expect(page.locator("#ar-contact-title")).toBeFocused();
      await expect(page.locator(".ar-selected-solution strong")).toHaveText(title);
      await expect(link).toHaveAttribute("aria-current", "true");
      await expect(page.locator('.ar-solution-consult[aria-current="true"]')).toHaveCount(1);
      await expect(page.locator(".ar-selection-help")).toContainText("solo en esta demo");
      await expect(page.locator("#ar-need")).toHaveValue(values.need);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Escribir por correo", exact: true })).toBeFocused();
      await submitWithKeyboard(page);
      await expect(page.locator(".ar-review")).toContainText(`Solución: ${title}`);
      await page.getByRole("button", { name: "Volver a la solución", exact: true }).click();
      const heading = page.getByRole("heading", { name: title, exact: true, level: 3 });
      await expect(heading).toBeFocused();
      await expect(heading).toBeInViewport({ ratio: 1 });
      await expect(page.locator("#ar-need")).toHaveValue(values.need);
      await expect(page.locator(".ar-review")).toContainText(`Solución: ${title}`);
    }
    await expect(page.locator(".ar-contact-form input")).toHaveCount(2);
    await expect(page.locator(".ar-contact-form textarea")).toHaveCount(1);
    await page.getByRole("button", { name: "Quitar solución elegida" }).click();
    await expect(page.locator(".ar-selected-solution")).toHaveCount(0);
    await expect(page.locator('.ar-solution-consult[aria-current="true"]')).toHaveCount(0);
    await expect(page.locator("#ar-name")).toBeFocused();
    await expect(page.locator("#ar-need")).toHaveValue(values.need);
    await expect(page.locator(".ar-review")).not.toContainText("Solución:");
    await page.locator(".ar-solution-consult").first().focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Borrar", exact: true }).click();
    await expect(page.locator(".ar-selected-solution")).toHaveCount(0);
    await expect(page.locator("#ar-need")).toHaveValue("");
    const direct = page.locator(".ar-contact-direct a");
    const boxes = await Promise.all((await direct.all()).map(link => link.boundingBox()));
    expect(boxes.every(Boolean)).toBe(true);
    expect(boxes[1]!.y).toBeGreaterThanOrEqual(boxes[0]!.y + boxes[0]!.height);
    expect(boxes[2]!.y).toBeGreaterThanOrEqual(boxes[1]!.y + boxes[1]!.height);
    expect(boxes[1]!.x).toBeCloseTo(boxes[0]!.x, 0);
    expect(boxes[2]!.x).toBeCloseTo(boxes[0]!.x, 0);
    await noOverflow(page);
  });
}

test("mobile menu names its state, spans the viewport and closes by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
  const menu = page.locator(".ar-mobile-menu"), toggle = menu.locator("summary");
  await expect(toggle).toHaveAccessibleName("Abrir menú de navegación");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAccessibleName("Cerrar menú de navegación");
  const box = await menu.locator("nav").boundingBox();
  expect(box?.x).toBe(0);expect(box?.width).toBe(390);
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAccessibleName("Abrir menú de navegación");
  await page.keyboard.press("Enter");
  await menu.getByRole("link", { name: "Experiencia", exact: true }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(page.locator("#projects")).toBeFocused();
  await noOverflow(page);
});

test("refined home preserves readable type, imagery and language context across viewports", async ({ page }, testInfo) => {
  await page.goto(url);
  await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    const bodySizes = await page.locator(".ar-solution-need, .ar-case-summary p, .ar-sector-gallery p").evaluateAll(elements => elements.map(e => parseFloat(getComputedStyle(e).fontSize)));
    expect(bodySizes.every(size => size >= 16)).toBe(true);
    const languageBoxes = await page.locator("#ar-languages a").evaluateAll(elements => elements.map(e => e.getBoundingClientRect().width));
    expect(languageBoxes.every(width => width >= 44)).toBe(true);
    await expect(page.locator("#ar-languages")).toHaveAttribute("aria-describedby", "ar-language-notice");
    if (width === 390 || width === 1440) {
      await page.locator("#services").scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`solutions-${width}.png`) });
      await page.locator("#projects").scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`cases-${width}.png`) });
    }
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator(".ar-header")).toHaveCSS("position", "relative");
  await noOverflow(page);
});

test("selection feedback respects reduced motion without losing its stable state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const motion of ["reduce", "no-preference"] as const) {
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto(url);
    await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
    await page.locator(".ar-solution-consult").first().click();
    const selected = page.locator(".ar-selected-solution");
    await expect(selected).toContainText("Reparación de pavimentos");
    const marker = await selected.evaluate(e => ({ animation: getComputedStyle(e, "::before").animationName, height: getComputedStyle(e, "::before").height }));
    expect(marker.animation).toBe(motion === "reduce" ? "none" : "ar-selection-confirm");
    expect(marker.height).toBe("2px");
    await noOverflow(page);
  }
});

test("200 percent text remains usable without changing application CSP", async ({ page }) => {
  // Simulate a user text-size override in fetched stylesheets; never relax CSP.
  await page.route(/\.css(?:\?|$)/, async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nhtml{font-size:200%}` });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.locator("html")).toHaveCSS("font-size", "32px");
  await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
  await noOverflow(page);
  await page.locator(".ar-solution-consult").first().click();
  await fillExample(page);
  await submitWithKeyboard(page);
  await expect(page.locator(".ar-review")).toBeFocused();
  await expect(page.locator(".ar-review")).toContainText(values.need.trim());
  await noOverflow(page);
});

test("return to an expanded solution keeps keyboard focus visible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(url);
  await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
  const solution = page.locator("#ar-solution-repair");
  await solution.locator("summary").click();
  await solution.locator(".ar-solution-consult").click();
  await fillExample(page);
  await submitWithKeyboard(page);
  await page.getByRole("button", { name: "Volver a la solución", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(solution.locator("h3")).toBeFocused();
  await expect(solution.locator("h3")).toBeInViewport({ ratio: 1 });
  const headingBox = await solution.locator("h3").boundingBox();
  const headerBox = await page.locator(".ar-header").boundingBox();
  expect(headingBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  await expect(solution.locator("details")).toHaveAttribute("open", "");
});

test("documentary photos load separately and hidden initial states wait for the report", async ({ page }) => {
  const mediaRequests: string[] = [];
  page.on("request", request => {
    if (decodeURIComponent(request.url()).includes("/architecture-preview/media/")) mediaRequests.push(request.url());
  });
  const response = await page.goto(url);
  expect(await response!.text()).not.toContain("data:image/");
  await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
  const card = page.locator(".ar-project-compact").first();
  await card.scrollIntoViewIfNeeded();
  const images = card.locator("img");
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).toHaveAttribute("srcset");
    await expect(image).toHaveAttribute("sizes", /calc\(100vw - 44px\)/);
  }
  await images.first().evaluate(image => (image as HTMLImageElement).decode());
  expect(mediaRequests.some(url => decodeURIComponent(url).includes("/initial/"))).toBe(false);
  const initial = card.locator(".ar-case-additional img");
  await card.locator("summary").click();
  await initial.scrollIntoViewIfNeeded();
  await initial.evaluate(image => (image as HTMLImageElement).decode());
  expect(mediaRequests.some(url => decodeURIComponent(url).includes("/initial/"))).toBe(true);
  expect(await initial.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test("stable case details preserve neighbouring cards and collapse by keyboard", async ({ page }, testInfo) => {
  for (const width of [390, 1440]) for (const motion of ["reduce", "no-preference"] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto(url);
    await expect(page.locator(".ar-contact-form")).toHaveAttribute("data-state", "idle");
    for (const card of await page.locator(".ar-project-compact").all()) {
      const toggle = card.locator("summary"), details = card.locator(".ar-case-full");
      await toggle.focus();await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("open", "");
      await expect(toggle).toContainText("Cerrar caso");
      const cardBox = await card.boundingBox(), gridBox = await page.locator(".ar-case-grid").boundingBox();
      expect(cardBox!.width).toBeLessThanOrEqual(gridBox!.width);
      if (width > 700) expect(cardBox!.width).toBeLessThan(gridBox!.width);
      await expect(details.locator(".ar-case-additional img")).toBeVisible();
      await noOverflow(page);
      await card.evaluate(e => e.scrollIntoView({ block: "start", behavior: "instant" }));
      await card.locator("img").evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
      await page.screenshot({ path: testInfo.outputPath(`report-${width}-${motion}-${await card.locator("h3").textContent()}.png`) });
      await toggle.focus();await page.keyboard.press("Enter");
      await expect(details).not.toHaveAttribute("open", "");
      await expect(toggle).toContainText("Ver caso");
      await expect(toggle).toBeFocused();
      await noOverflow(page);
    }
  }
});

test("skip link remains readable and the header logo has a 44 pixel target", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  const colors = await skip.evaluate(element => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(colors.color).not.toBe(colors.background);
  const logo = page.locator(".ar-header .ar-logo");
  expect((await logo.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Enter");
  await expect(page.locator("#ar-content")).toBeFocused();
});
