import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const locales = [
  {
    locale: "en",
    home: "/en/",
    projects: "/en/projects/",
    case: "/en/projects/blitz-bremen/",
    notice: "/en/legal-notice/",
    privacy: "/en/privacy/",
    cookies: "/en/cookies/",
    contact: "/en/contact/",
    hero: "Repairs planned to reduce operational disruption.",
    projectTitle: "Completed works, explained through evidence.",
    contactTitle: "Tell us what is happening to the floor",
  },
  {
    locale: "de",
    home: "/de/",
    projects: "/de/projekte/",
    case: "/de/projekte/blitz-bremen/",
    notice: "/de/impressum/",
    privacy: "/de/datenschutz/",
    cookies: "/de/cookies/",
    contact: "/de/kontakt/",
    hero: "Geplante Reparaturen zur Verringerung betrieblicher Beeinträchtigungen.",
    projectTitle: "Ausgeführte Arbeiten, anhand von Nachweisen erklärt.",
    contactTitle: "Beschreiben Sie uns den Zustand des Bodens",
  },
  {
    locale: "es",
    home: "/es/",
    projects: "/es/proyectos/",
    case: "/es/proyectos/blitz-bremen/",
    notice: "/es/aviso-legal/",
    privacy: "/es/privacidad/",
    cookies: "/es/cookies/",
    contact: "/es/contacto/",
    hero: "Reparaciones planificadas para reducir el impacto operativo.",
    projectTitle: "Obras ejecutadas, explicadas desde la evidencia.",
    contactTitle: "Cuéntanos qué ocurre en el pavimento",
  },
  {
    locale: "fr",
    home: "/fr/",
    projects: "/fr/projets/",
    case: "/fr/projets/blitz-bremen/",
    notice: "/fr/mentions-legales/",
    privacy: "/fr/confidentialite/",
    cookies: "/fr/cookies/",
    contact: "/fr/contact/",
    hero: "Des réparations planifiées pour réduire l'impact opérationnel.",
    projectTitle: "Des travaux réalisés, expliqués par les preuves.",
    contactTitle: "Décrivez-nous l'état du sol",
  },
] as const;

const contentRoutes = locales.flatMap((entry) => [
  { path: entry.home, images: 24 },
  { path: entry.projects, images: 18 },
  { path: entry.case, images: 3 },
  { path: entry.notice, images: 0 },
  { path: entry.privacy, images: 0 },
  { path: entry.cookies, images: 0 },
  { path: entry.contact, images: 0 },
]);

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
      if (!["127.0.0.1", "localhost"].includes(url.hostname)) thirdPartyRequests.push(request.url());
    });

    const response = await page.goto(route.path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("img")).toHaveCount(route.images);
    await expect(page.locator("html")).toHaveAttribute("lang", route.path.slice(1, 3));

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);

    const pageState = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      internallyOverflowingElements: [...document.querySelectorAll<HTMLElement>("body, body *")]
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => ({
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.className ? `.${String(element.className).trim().replaceAll(" ", ".")}` : ""}`,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        })),
      unexpectedTextOverflows: [...document.querySelectorAll<HTMLElement>(
        ".hero h1, .relato .linea, main h1, main h2, .legal-shell .intro, .contact-intro",
      )]
        .filter((element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1)
        .map((element) => ({
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.className ? `.${String(element.className).trim().replaceAll(" ", ".")}` : ""}`,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          text: element.textContent?.trim().slice(0, 80),
        })),
      overflowingElements: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((element) => {
          if (element.closest("[inert]") || element.matches(".skip:not(:focus)")) return false;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.right > document.documentElement.clientWidth + 1 || rect.left < -1);
        })
        .map((element) => ({
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.className ? `.${String(element.className).trim().replaceAll(" ", ".")}` : ""}`,
          text: element.textContent?.trim().slice(0, 80),
          rect: element.getBoundingClientRect().toJSON(),
        })),
      brokenImages: [...document.querySelectorAll<HTMLImageElement>("img")]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      temporaryNamePresent: document.body.textContent?.includes("RemainOn") ?? false,
    }));

    expect(
      pageState.scrollWidth,
      JSON.stringify({
        clientWidth: pageState.clientWidth,
        overflowingElements: pageState.overflowingElements,
        internallyOverflowingElements: pageState.internallyOverflowingElements,
      }),
    ).toBeLessThanOrEqual(pageState.clientWidth);
    expect(pageState.brokenImages).toEqual([]);
    expect(pageState.unexpectedTextOverflows).toEqual([]);
    expect(pageState.temporaryNamePresent).toBe(false);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(thirdPartyRequests).toEqual([]);
  });
}

test("localized display headings reflow from 320 to 390 CSS pixels", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile reflow matrix");

  for (const width of [320, 360, 375, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const entry of locales) {
      await page.goto(entry.home, { waitUntil: "networkidle" });
      const state = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        textOverflows: [...document.querySelectorAll<HTMLElement>(".hero h1, .relato .linea")]
          .filter((element) => element.scrollWidth > element.clientWidth + 1)
          .map((element) => ({
            text: element.textContent?.trim(),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
          })),
      }));
      expect(state.scrollWidth, `${entry.locale} at ${width}px`).toBeLessThanOrEqual(state.clientWidth);
      expect(state.textOverflows, `${entry.locale} at ${width}px`).toEqual([]);
    }
  }
});

for (const entry of locales) {
  test(`${entry.locale} locale has coherent routes and language counterparts`, async ({ page }) => {
    await page.goto(entry.home, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(entry.hero);
    for (const counterpart of locales) {
      await expect(page.locator(`a[hreflang="${counterpart.locale}"][href="${counterpart.home}"]`).first())
        .toBeAttached();
    }

    await page.goto(entry.projects, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(entry.projectTitle);
    await page.goto(entry.case, { waitUntil: "networkidle" });
    await expect(page.locator("main h1")).toContainText("Blitz");
    await page.goto(entry.contact, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(entry.contactTitle);
    await expect(page.locator("form")).toHaveCount(0);
  });
}

for (const path of locales.flatMap((entry) => [entry.home, entry.projects])) {
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
  test.skip(testInfo.project.name !== "mobile-chromium", "The rule does not depend on viewport size");
  await page.goto("/en/", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch"])
    .analyze();
  expect(results.violations).toEqual([]);
});

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

test("mobile menu traps and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only interaction");

  await page.goto("/en/", { waitUntil: "networkidle" });
  const trigger = page.locator(".hero .menu-btn");
  const menu = page.locator("#menuMovil");
  const close = menu.getByRole("button", { name: "Close menu" });
  const lastLink = menu.getByRole("link", { name: /View projects/ }).last();

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

test("redirects, closed routes, contact API and security policy fail closed", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "The HTTP policy does not depend on viewport size");

  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/$/);
  await page.goto("/proyectos/");
  await expect(page).toHaveURL(/\/es\/proyectos\/$/);

  const closedRoute = await request.get("/en/solutions/");
  expect(closedRoute.status()).toBe(404);
  const contact = await request.post("/api/contact/", { data: {} });
  expect(contact.status()).toBe(503);

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("<url>");

  const response = await page.goto("/en/", { waitUntil: "networkidle" });
  const headers = response?.headers() ?? {};
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["strict-transport-security"]).toBe("max-age=31536000");
  expect(headers["content-security-policy"]).toContain("form-action 'self'");
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

test("WebKit smoke: localized home, project and contact load", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-webkit", "WebKit-only smoke coverage");
  for (const path of ["/en/", "/de/projekte/blitz-bremen/", "/fr/contact/"]) {
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  }
});
