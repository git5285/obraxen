import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertHomeContract, inspectHomeContract } from "../scripts/home-contract.mjs";

const html = readFileSync(new URL("../apps/public-site/public/index.html", import.meta.url), "utf8");
describe("Home nonactivation contract (independent from legacy)", () => {
  it("accepts the maintained Home, without authorizing publication", () => {
    expect(assertHomeContract(fileURLToPath(new URL("../apps/public-site", import.meta.url)))).toMatchObject({
      ok: true, routes: ["/", "/en", "/de"], publicationAuthorized: false,
    });
  });
  it("accepts editorial changes without a whole-document hash exemption", () => {
    expect(inspectHomeContract({ html: html.replace("Recuperamos tus pavimentos.", "Otro titular editorial.") }).ok).toBe(true);
  });
  it.each([
    ["indexing", html.replace("noindex,nofollow", "index,follow")],
    ["conflicting robots", html + '<meta name="googlebot" content="index,follow">'],
    ["native form", html.replace("form-action 'none'", "form-action 'self'")],
    ["sending form", html.replace('<form ', '<form action="/api/contact" ')],
    ["sending button", html + '<button formaction="/api/contact">Send</button>'],
    ["external script", html + '<script src="https://example.invalid/analytics.js"></script>'],
    ["protocol relative script", html + '<script src="//example.invalid/analytics.js"></script>'],
    ["missing contact", html.replaceAll("mailto:info@obraxen.com", "mailto:other@example.invalid")],
  ])("rejects %s", (_, candidate) => {
    expect(inspectHomeContract({html: candidate}).ok).toBe(false);
  });
  it.each(["fetch('/api/contact')", "navigator.sendBeacon('/events', data)", "localStorage.setItem('contact', value)",
    "sessionStorage.setItem('contact', value)", "new XMLHttpRequest()", "document.cookie = 'x=y'",
    "gtag('config', 'id')",
  ])("rejects sending, tracking or storage code: %s", script => {
    expect(inspectHomeContract({html, scripts: [script]}).ok).toBe(false);
  });
  it("rejects additional routes and public indexability files", () => {
    expect(inspectHomeContract({html, routeFiles: ["route.js", "en/route.js", "de/route.js", "api/contact/route.js"]}).ok).toBe(false);
    expect(inspectHomeContract({html, publicFiles: ["robots.txt"]}).ok).toBe(false);
    expect(inspectHomeContract({html, publicFiles: [".env"]}).ok).toBe(false);
    expect(inspectHomeContract({html, publicFiles: ["other.html"]}).ok).toBe(false);
    expect(inspectHomeContract({html, publicFiles: ["assets/other.html"]}).ok).toBe(false);
  });
});
