import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../apps/public-site/public/assets/home-i18n.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../apps/public-site/public/index.html", import.meta.url), "utf8");
type Translator = {
  locale: string;
  message: (key: string, params?: Record<string, string | number>) => string;
  translate: (value: string) => string;
  missingTranslations: string[];
};

// Exercise the real browser script. DOM interactions have separate Playwright coverage.
function translator(locale: string, captureObserver?: (callback: (records: object[]) => void) => void, nodes: object[] = []): Translator {
  let cursor = -1;
  const context = {
    location: { pathname: locale === "es" ? "/" : `/${locale}` },
    window: {} as { obraxenI18n: Translator },
    document: {
      body: { nodeType: 11, querySelectorAll: () => [] },
      documentElement: { lang: "es" },
      querySelector: () => null,
      createTreeWalker: () => ({ nextNode: () => ++cursor < nodes.length, get currentNode() { return nodes[cursor]; } }),
    },
    Node: { TEXT_NODE: 3, ELEMENT_NODE: 1, DOCUMENT_FRAGMENT_NODE: 11 },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class {
      constructor(callback: (records: object[]) => void) { captureObserver?.(callback); }
      observe() {}
      disconnect() {}
    },
  };
  vm.runInNewContext(source, context);
  return context.window.obraxenI18n;
}

describe("published Home translations", () => {
  it.each(["es", "en", "de"])("keeps the four solution summaries translated after punctuation edits in %s", locale => {
    const keys = ["solution.repair.summary", "solution.polish.summary", "solution.level.summary", "solution.prepare.summary"];
    const client = translator(locale);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      expect(html).toContain(`id="solution-summary-${i + 1}" data-i18n="${key}"`);
      const spanish = translator("es").message(key);
      const edited = spanish.replace(/\.$/, "");
      const node = {nodeValue: edited, parentElement: {closest: () => null, getAttribute: () => key}};
      const rendered = translator(locale, undefined, [node]);
      expect(node.nodeValue).toBe(locale === "es" ? edited : client.message(key));
      expect(rendered.missingTranslations).toEqual([]);
    }
  });

  it.each(["es", "en", "de"])("keeps contact intro translation stable after a Spanish editorial edit in %s", locale => {
    expect(html).toContain('data-i18n="contact.intro"');
    const edited = "Explica el estado de tu pavimento y el uso de tu instalación.";
    const node = {nodeValue: edited, parentElement: {closest: () => null, getAttribute: () => "contact.intro"}};
    const client = translator(locale, undefined, [node]);
    expect(node.nodeValue).toBe(locale === "es" ? edited : client.message("contact.intro"));
    expect(client.missingTranslations).toEqual([]);
  });

  it("rejects an unknown DOM translation key", () => {
    const node = {nodeValue: "Texto", parentElement: {closest: () => null, getAttribute: () => "contact.missing"}};
    expect(() => translator("en", undefined, [node])).toThrow("Missing Home translation");
  });
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

  it.each(["es", "en", "de"])("resolves all contact keys and parameterized messages in %s", locale => {
    const client = translator(locale);
    const contact = readFileSync(new URL("../apps/public-site/public/assets/home-contact.js", import.meta.url), "utf8");
    const literalKeys = [...contact.matchAll(/['"](contact\.[\w.]+)['"]/g)].map(match => match[1]).filter(key => !key.endsWith("."));
    const sectors = ["logistica", "industria", "automocion", "distribucion", "alimentacion", "aparcamientos"];
    for (const key of [...literalKeys, ...sectors.map(sector => "contact.prompt." + sector)]) {
      expect(client.message(key, { count: 10, name: "Delticom" })).toBeTruthy();
    }
    expect(() => client.message("contact.minLength")).toThrow("Missing Home parameter");
    const rendered = client.message("contact.minLength", { count: 10 });
    expect(rendered).toContain("10");
    client.translate(rendered);
    client.translate(client.message("contact.sector", {name: "Delticom"}));
    expect(client.missingTranslations).toEqual([]);
  });

  it.each(["en", "de"])("audits inserted and changed dynamic text and attributes in %s", locale => {
    let observe!: (records: object[]) => void;
    const client = translator(locale, callback => { observe = callback; });
    const node = (value: string) => ({nodeType: 3, nodeValue: value,
      parentElement: {closest: () => null, getAttribute: () => null}});
    observe([{type: "childList", addedNodes: [node("Texto dinámico nuevo")] }]);
    observe([{type: "characterData", target: node("Texto cambiado nuevo"), addedNodes: []}]);
    observe([{type: "attributes", target: {
      hasAttribute: (name: string) => name === "placeholder", getAttribute: () => "Atributo dinámico nuevo",
    }, addedNodes: []}]);
    expect(client.missingTranslations).toEqual(["Atributo dinámico nuevo", "Texto cambiado nuevo", "Texto dinámico nuevo"]);
    const translated = client.message("contact.maxLength", {count: 200});
    observe([{type: "childList", addedNodes: [node(translated), node("Delticom")]}]);
    expect(client.missingTranslations).toHaveLength(3);
    client.translate("Ver sector: Otro sector sin traducción");
    expect(client.missingTranslations).toContain("Otro sector sin traducción");
  });
});
