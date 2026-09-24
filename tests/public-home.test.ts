import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../apps/public-site/public/assets/home-i18n.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../apps/public-site/public/index.html", import.meta.url), "utf8");
type Translator = {
  locale: string;
  message: (key: string) => string;
  translate: (value: string) => string;
  missingTranslations: string[];
};

// Exercise the real browser script. DOM interactions have separate Playwright coverage.
function translator(locale: string): Translator {
  const context = {
    location: { pathname: locale === "es" ? "/" : `/${locale}` },
    window: {} as { obraxenI18n: Translator },
    document: {
      body: { nodeType: 11, querySelectorAll: () => [] },
      documentElement: { lang: "es" },
      querySelector: () => null,
      createTreeWalker: () => ({ nextNode: () => false }),
    },
    Node: { TEXT_NODE: 3, ELEMENT_NODE: 1, DOCUMENT_FRAGMENT_NODE: 11 },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class { observe() {} },
  };
  vm.runInNewContext(source, context);
  return context.window.obraxenI18n;
}

describe("published Home translations", () => {
  it.each([
    ["es", "1 de 4", "1–2 de 4"],
    ["en", "1 of 4", "1–2 of 4"],
    ["de", "1 von 4", "1–2 von 4"],
  ])("translates single and range carousel positions in %s", (locale, single, range) => {
    const client = translator(locale);
    expect(client.translate("1 de 4")).toBe(single);
    expect(client.translate("1–2 de 4")).toBe(range);
    expect(client.missingTranslations).toEqual([]);
  });

  it.each(["es", "en", "de"])("resolves every maintained markup key in %s", locale => {
    const client = translator(locale);
    const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1]);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) expect(client.message(key)).toBeTruthy();
    expect(() => client.message("unknown.editorial.key")).toThrow("Missing Home translation");
  });

  it.each(["en", "de"])("reports missing copy without confusing proper names in %s", locale => {
    const client = translator(locale);
    expect(client.translate("Delticom")).toBe("Delticom");
    expect(client.translate("info@obraxen.com")).toBe("info@obraxen.com");
    expect(client.missingTranslations).toEqual([]);
    const missing = "Texto editorial nuevo pendiente de traducir";
    expect(client.translate(missing)).toBe(missing);
    expect(client.missingTranslations).toEqual([missing]);
    client.translate(missing);
    expect(client.missingTranslations).toEqual([missing]);
  });

  it("uses stable keys for headlines independently of the Spanish fallback", () => {
    expect(translator("en").message("hero.title")).toBe("We restore your floors.");
    expect(translator("de").message("hero.title")).toBe("Wir setzen Ihre Böden instand.");
  });
});
