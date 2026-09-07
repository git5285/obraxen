import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { request as requestHttp } from "node:http";
import { createServer } from "node:https";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { getPath } from "@/lib/i18n";
import { publicProjectImages } from "@/lib/public-project-assets";
import { isPublicProject } from "@/lib/public-project-publication";

const projects = JSON.parse(readFileSync(resolve(process.cwd(), "data/proyectos.json"), "utf8"));
const publicProject = projects.find(
  (project: typeof projects[number]) => isPublicProject(project, publicProjectImages),
);
const unpublishedProject = projects.find(
  (project: typeof projects[number]) => !isPublicProject(project, publicProjectImages),
);

const locales = [
  {
    locale: "en",
    home: "/en/",
    projects: "/en/projects/",
    notice: "/en/legal-notice/",
    privacy: "/en/privacy/",
    cookies: "/en/cookies/",
    contact: "/en/contact/",
    hero: "Industrial floor repair.",
    projectTitle: "Completed works, explained through evidence.",
    emptyProjectTitle: "Projects",
    contactTitle: "Tell us what is happening to the floor",
  },
  {
    locale: "de",
    home: "/de/",
    projects: "/de/projekte/",
    notice: "/de/impressum/",
    privacy: "/de/datenschutz/",
    cookies: "/de/cookies/",
    contact: "/de/kontakt/",
    hero: "Instandsetzung von Industrieböden.",
    projectTitle: "Ausgeführte Arbeiten, anhand von Nachweisen erklärt.",
    emptyProjectTitle: "Projekte",
    contactTitle: "Beschreiben Sie uns den Zustand des Bodens",
  },
  {
    locale: "es",
    home: "/es/",
    projects: "/es/proyectos/",
    notice: "/es/aviso-legal/",
    privacy: "/es/privacidad/",
    cookies: "/es/cookies/",
    contact: "/es/contacto/",
    hero: "Reparación de pavimentos industriales.",
    projectTitle: "Obras ejecutadas, explicadas desde la evidencia.",
    emptyProjectTitle: "Proyectos",
    contactTitle: "Cuéntanos qué ocurre en el pavimento",
  },
  {
    locale: "fr",
    home: "/fr/",
    projects: "/fr/projets/",
    notice: "/fr/mentions-legales/",
    privacy: "/fr/confidentialite/",
    cookies: "/fr/cookies/",
    contact: "/fr/contact/",
    hero: "Réparation de sols industriels.",
    projectTitle: "Des travaux réalisés, expliqués par les preuves.",
    emptyProjectTitle: "Projets",
    contactTitle: "Décrivez-nous l'état du sol",
  },
] as const;

const contentRoutes = locales.flatMap((entry) => [
  { path: entry.home },
  { path: entry.projects },
  ...(publicProject ? [{ path: getPath(entry.locale, "projects", publicProject.slug) }] : []),
  { path: entry.notice },
  { path: entry.privacy },
  { path: entry.cookies },
  { path: entry.contact },
]);

test("mobile usability: short menus keep all links reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Explicit mobile viewport matrix");
  for (const locale of locales) {
    for (const viewport of [{ width: 667, height: 375 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(locale.home, { waitUntil: "networkidle" });
      const reject = page.locator(".consent-actions .consent-choice").first();
      if (await reject.isVisible()) await reject.click();
      const trigger = page.locator(".hero-nav .menu-btn");
      await trigger.click();
      const menu = page.locator(".movil-menu");
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
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    }
  }
});

test("mobile usability: privacy control does not cover contact content", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Explicit mobile viewport matrix");
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/es/contacto/", { waitUntil: "networkidle" });
    const reject = page.locator(".consent-actions .consent-choice").first();
    const reopen = page.locator(".consent-reopen");
    const expectVisibleFocus = async () => {
      await expect(reopen).toBeFocused();
      await expect.poll(() => reopen.evaluate((button) => {
        const bounds = button.getBoundingClientRect();
        return bounds.top >= 0 && bounds.bottom <= innerHeight
          && bounds.left >= 0 && bounds.right <= innerWidth;
      })).toBe(true);
    };
    if (await reject.isVisible()) {
      await reject.focus();
      await page.keyboard.press("Enter");
      await expectVisibleFocus();
    }
    await expect(reopen).toBeVisible();
    const overlapsContent = () => reopen.evaluate((button) => {
      const a = button.getBoundingClientRect();
      return [...document.querySelectorAll("main p, main h1, main h2, main a")].some((element) => {
        const b = element.getBoundingClientRect();
        return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      });
    });
    expect(await overlapsContent()).toBe(false);
    await reopen.scrollIntoViewIfNeeded();
    expect(await overlapsContent()).toBe(false);
    await reopen.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectVisibleFocus();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: testInfo.outputPath(`privacy-contact-${viewport.width}.png`), fullPage: true });
  }
});

for (const locale of locales) {
  test(`${locale.locale} approved logo across responsive navigation and interior pages`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "One explicit viewport matrix avoids duplicate browser projects");
    test.setTimeout(120_000);
    for (const width of [320, 390, 620, 621, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: width === 320 ? 667 : width === 390 ? 844 : 900 });
      for (const route of [locale.home, locale.projects, locale.notice, locale.contact]) {
        await page.goto(route, { waitUntil: "networkidle" });
        const marks = page.locator(".logo:visible .logo-wordmark");
        await expect(marks).toHaveCount(route === locale.home ? 2 : route === locale.notice ? 0 : 1);
        for (const mark of await marks.all()) {
          await expect(mark).toHaveAttribute("aria-hidden", "true");
          await expect(mark).toHaveAttribute("viewBox", "-24 -33 876 166");
          await expect(mark.locator("use")).toHaveCount(7);
          await expect.poll(() => mark.evaluate((svg: SVGSVGElement) => svg.getBBox().width)).toBe(828);
          expect(await mark.evaluate((svg: SVGSVGElement) => svg.getBBox().height)).toBe(118);
          const bounds = await mark.boundingBox();
          expect(bounds?.width).toBeCloseTo(180, 1);
          expect(bounds?.height).toBeCloseTo(180 * 166 / 876, 1);
          await expect(mark.locator("..")).toHaveAttribute("href", locale.home);
          await expect(mark.locator("..")).toHaveAttribute("aria-label", /^Obraxen, .+/);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        if (route === locale.home) {
          const nav = page.locator(".hero-nav");
          const overlap = await nav.evaluate((element) => {
            const bounds = [...element.children].map(child => child.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
            return bounds.some((a, index) => bounds.slice(index + 1).some(b => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom));
          });
          expect(overlap).toBe(false);
          if (width <= 620) await expect(nav.locator(":scope > .btn")).toBeHidden();
          await expect(page.locator(".hero-summary > .btn")).toBeVisible();
          const menu = nav.locator(".menu-btn");
          if (await menu.isVisible()) {
            await menu.focus();
            await page.keyboard.press("Enter");
            await expect(menu).toHaveAttribute("aria-expanded", "true");
            await page.keyboard.press("Escape");
            await expect(menu).toBeFocused();
            await expect(menu).toHaveAttribute("aria-expanded", "false");
          }
          await page.screenshot({ path: testInfo.outputPath(`logo-${locale.locale}-${width}.png`) });
          await page.locator("#services").scrollIntoViewIfNeeded();
          await expect(page.locator(".sticky-nav")).toBeVisible();
          await expect(page.locator(".sticky-nav .logo-wordmark")).toBeVisible();
          const stickyBounds = await page.locator(".sticky-nav .logo-wordmark").boundingBox();
          expect(stickyBounds?.width).toBeCloseTo(180, 1);
          if (width <= 620) await expect(page.locator(".sticky-nav .inner > .btn")).toBeHidden();
        }
      }
    }
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/obraxen-favicon-v14.ico");
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("sizes", "16x16 32x32");
    const response = await page.request.get("/obraxen-favicon-v14.ico");
    expect(response.status()).toBe(200);
    expect(createHash("sha256").update(await response.body()).digest("hex")).toBe("b2d4b7bee37bcc6e588164b431dc29fee80f1085f13b5d4d28dea9d859dc5418");
  });
}

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
    await page.setViewportSize({ width, height: 667 });
    for (const entry of locales) {
      await page.goto(entry.home, { waitUntil: "networkidle" });
      const state = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        rectOverflows: [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((element) => {
            if (element.closest("[inert], .sectores .cinta") || element.matches(".skip:not(:focus)")) {
              return false;
            }
            const style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden") return false;
            const rect = element.getBoundingClientRect();
            const visibleInternalOverflow = style.overflowX === "visible"
              && element.scrollWidth > element.clientWidth + 1
              && rect.left + element.scrollWidth > document.documentElement.clientWidth + 1;
            return rect.width > 0 && (rect.right > document.documentElement.clientWidth + 1
              || rect.left < -1
              || visibleInternalOverflow);
          })
          .map((element) => ({
            selector: `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replaceAll(" ", ".")}` : ""}`,
            rect: element.getBoundingClientRect().toJSON(),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            text: element.textContent?.trim().slice(0, 80),
          })),
        textOverflows: [...document.querySelectorAll<HTMLElement>(".hero h1, .relato .linea, .catalogo li")]
          .filter((element) => element.scrollWidth > element.clientWidth + 1)
          .map((element) => ({
            text: element.textContent?.trim(),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
          })),
      }));
      expect(state.scrollWidth, `${entry.locale} at ${width}px: ${JSON.stringify(state.rectOverflows)}`)
        .toBeLessThanOrEqual(state.clientWidth);
      expect(state.rectOverflows, `${entry.locale} at ${width}px`).toEqual([]);
      expect(state.textOverflows, `${entry.locale} at ${width}px`).toEqual([]);
      const nextSectionLabel = await page.locator(".intro .kicker").boundingBox();
      expect(nextSectionLabel, `${entry.locale} at ${width}px: next section exists`).not.toBeNull();
      expect(nextSectionLabel!.y + nextSectionLabel!.height, `${entry.locale} at ${width}px: next section visible`)
        .toBeLessThanOrEqual(667);
    }
  }
});

test("short mobile hero keeps the next section visible with wider fallback fonts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile fallback font regression");
  await page.setViewportSize({ width: 320, height: 667 });

  // Exercise platform font metrics without relaxing the production CSP.
  await page.route("**/*.css", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: `${await response.text()}\n:root { --font-sans: Verdana, sans-serif; --font-display: Verdana, sans-serif; }`,
    });
  });

  for (const entry of locales) {
    await page.goto(entry.home, { waitUntil: "networkidle" });
    const state = await page.evaluate(() => {
      const label = document.querySelector<HTMLElement>(".intro .kicker");
      return {
        labelBottom: label?.getBoundingClientRect().bottom,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        font: getComputedStyle(document.body).fontFamily,
      };
    });
    expect(state.font).toContain("Verdana");
    expect(state.scrollWidth, entry.locale).toBeLessThanOrEqual(state.clientWidth);
    expect(state.labelBottom, `${entry.locale}: next section exists`).toBeDefined();
    expect(state.labelBottom, `${entry.locale}: next section visible`).toBeLessThanOrEqual(667);
  }
});

for (const entry of locales) {
  test(`${entry.locale} locale has coherent routes and language counterparts`, async ({ page }) => {
    await page.goto(entry.home, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(entry.hero);
    for (const counterpart of locales) {
      await expect(page.locator(`a[hreflang="${counterpart.locale}"][href="${counterpart.home}"]`).first())
        .toBeAttached();
      await expect(page.locator(`head link[rel="alternate"][hreflang="${counterpart.locale}"]`))
        .toHaveAttribute("href", `https://obraxen.com${counterpart.home}`);
    }

    await page.goto(entry.projects, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(publicProject ? entry.projectTitle : entry.emptyProjectTitle);
    if (!publicProject) {
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator('head link[rel="alternate"][hreflang]')).toHaveCount(0);
      await expect(page.locator('head link[rel="canonical"]'))
        .toHaveAttribute("href", `https://obraxen.com${entry.projects}`);
    }
    if (publicProject) {
      await page.goto(getPath(entry.locale, "projects", publicProject.slug), { waitUntil: "networkidle" });
      await expect(page.locator("main h1")).toContainText(publicProject.traducciones[entry.locale].titulo);
    } else if (unpublishedProject) {
      const response = await page.goto(getPath(entry.locale, "projects", unpublishedProject.slug));
      expect(response?.status()).toBe(404);
    }
    await page.goto(entry.contact, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(entry.contactTitle);
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('head link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expect(page.locator('head link[rel="canonical"]'))
      .toHaveAttribute("href", `https://obraxen.com${entry.contact}`);
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

test("contact page exposes a skip link", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Keyboard behavior is viewport independent");

  await page.goto("/es/contacto/", { waitUntil: "networkidle" });
  const skipLink = page.getByRole("link", { name: "Saltar al contenido" });

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");

  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#contact-content");
  await expect(page.locator("#contact-content")).toBeVisible();
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

test("redirects, closed routes, contact API and security policy fail closed", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "The HTTP policy does not depend on viewport size");

  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/$/);
  await page.goto("/proyectos/");
  await expect(page).toHaveURL(/\/es\/proyectos\/$/);

  const closedRoute = await request.get("/en/solutions/");
  expect(closedRoute.status()).toBe(404);
  if (unpublishedProject) {
    const unpublishedRoute = await request.get(getPath("en", "projects", unpublishedProject.slug));
    expect(unpublishedRoute.status()).toBe(404);
  }
  const qaHarness = await request.get("/qa/contact-harness/");
  expect(qaHarness.status()).toBe(404);
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
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
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
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://obraxen.com/en/",
  );
});

async function secureLocalOrigin(baseURL: string) {
  const upstream = new URL(baseURL);
  if (upstream.hostname !== "127.0.0.1") throw new Error("HTTPS fixture must target loopback");
  const directory = mkdtempSync(join(tmpdir(), "obraxen-webkit-tls-"));
  try {
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
      "-subj", "/CN=localhost", "-keyout", join(directory, "key.pem"), "-out", join(directory, "cert.pem")], { stdio: "ignore" });
    const server = createServer({ key: readFileSync(join(directory, "key.pem")), cert: readFileSync(join(directory, "cert.pem")) }, (request, response) => {
      const forwarded = requestHttp({ hostname: upstream.hostname, port: upstream.port, path: request.url,
        method: request.method, headers: { ...request.headers, host: upstream.host } }, (result) => {
        response.writeHead(result.statusCode ?? 502, result.headers);
        result.pipe(response);
      });
      forwarded.on("error", () => { response.writeHead(502); response.end(); });
      request.pipe(forwarded);
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing HTTPS fixture port");
    return {
      origin: `https://127.0.0.1:${address.port}`,
      async close() {
        server.closeAllConnections();
        await new Promise<void>(resolve => server.close(() => resolve()));
        rmSync(directory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

test("WebKit smoke: localized public routes load", async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-webkit", "WebKit-only smoke coverage");
  // WebKit upgrades HTTP subresources under the production CSP, including on loopback.
  const secure = await secureLocalOrigin(baseURL!);
  let context: Awaited<ReturnType<typeof browser.newContext>> | undefined;
  try {
    context = await browser.newContext({ baseURL: secure.origin, ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("requestfailed", request => errors.push(request.url()));
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const paths = ["/en/", "/de/projekte/", "/fr/contact/"];
    if (publicProject) paths.push(getPath("de", "projects", publicProject.slug));
    for (const path of paths) {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      expect(response?.headers()["content-security-policy"]).toContain("upgrade-insecure-requests");
      await expect(page.locator("h1")).toHaveCount(1);
      const mark = page.locator(".hero-nav .logo-wordmark, .projects-nav .logo-wordmark, .case-nav .logo-wordmark, .contact-nav .logo-wordmark");
      await expect(mark).toHaveCount(1);
      await expect(mark).toBeVisible();
      await expect.poll(() => mark.evaluate((svg: SVGSVGElement) => svg.getBBox().width)).toBe(828);
      expect(await mark.evaluate((svg: SVGSVGElement) => svg.getBBox().height)).toBe(118);
      expect((await mark.boundingBox())?.width).toBeCloseTo(180, 1);
      if (path === "/en/") {
        await expect(page.locator(".sticky-nav")).toBeHidden();
        await page.locator("#services").scrollIntoViewIfNeeded();
        const sticky = page.locator(".sticky-nav .logo-wordmark");
        await expect(sticky).toBeVisible();
        expect((await sticky.boundingBox())?.width).toBeCloseTo(180, 1);
        expect(await sticky.evaluate((svg: SVGSVGElement) => svg.getBBox().width)).toBe(828);
      }
    }
    expect(errors).toEqual([]);
  } finally {
    try {
      await context?.close();
    } finally {
      await secure.close();
    }
  }
});
