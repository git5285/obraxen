import { expect, test, type Page } from "@playwright/test";

async function fillValidContactForm(page: Page) {
  await page.locator("#contact-name").fill("Alex Example");
  await page.locator("#contact-email").fill("alex@example.org");
  await page.locator("#contact-company").fill("Example GmbH");
  await page.locator("#contact-country").fill("Germany");
  await page.locator("#contact-message").fill("Damaged joints in an operating logistics facility.");
  await page.locator('input[name="consent"]').check();
}

test("enabled contact UI validates, submits once and reports success", async ({ page }) => {
  let apiRequests = 0;
  let payload: Record<string, unknown> | null = null;
  let releaseResponse = () => {};
  const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve; });

  await page.route("**/api/contact/", async (route) => {
    apiRequests += 1;
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await responseGate;
    await route.fulfill({ status: 202, contentType: "application/json", body: '{"ok":true}' });
  });

  await page.goto("/qa/contact-harness/?utm_source=quality-gate", { waitUntil: "networkidle" });
  const form = page.locator("form.contact-form");
  const submit = form.locator('button[type="submit"]');
  await expect(form).toBeVisible();

  await submit.click();
  expect(apiRequests).toBe(0);
  await expect(page.locator("#contact-name")).toBeFocused();
  await expect(page.locator("#contact-name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#contact-name-error")).toBeVisible();
  await expect(page.locator("#contact-status")).toContainText("Review the highlighted fields before submitting.");

  await fillValidContactForm(page);
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect.poll(() => apiRequests).toBe(1);
  releaseResponse();

  await expect(submit).toBeEnabled();
  await expect(page.locator("#contact-status")).not.toBeEmpty();
  await expect(form.locator("#contact-name")).toHaveValue("");
  expect(payload).toMatchObject({
    locale: "en",
    name: "Alex Example",
    email: "alex@example.org",
    company: "Example GmbH",
    country: "Germany",
    consent: true,
    source: "/qa/contact-harness/",
    utm: { source: "quality-gate" },
  });
});

test("enabled contact UI recovers from a delivery error", async ({ page }) => {
  await page.route("**/api/contact/", (route) => route.fulfill({
    status: 502,
    contentType: "application/json",
    body: '{"ok":false,"code":"delivery_failed"}',
  }));
  await page.goto("/qa/contact-harness/", { waitUntil: "networkidle" });
  await fillValidContactForm(page);

  const submit = page.locator('form.contact-form button[type="submit"]');
  await submit.click();
  await expect(submit).toBeEnabled();
  await expect(page.locator("#contact-status")).not.toBeEmpty();
  await expect(page.locator("#contact-name")).toHaveValue("Alex Example");
});
