import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Resolve from the actual consumer, not the possibly different root dependency.
const fromConsumer = (name: string) => createRequire(resolve("node_modules", name, "package.json"));

describe("Vercel security overrides", () => {
  it.each(["vercel", "@vercel/node"])("preserves %s HTTP request and fetch contracts", async (consumer) => {
    const load = fromConsumer(consumer);
    const { MockAgent, request, fetch, Headers, Agent, ProxyAgent } = load("undici");
    expect(load("undici/package.json").version).toBe("6.28.1");
    expect(typeof Agent).toBe("function");
    expect(typeof ProxyAgent).toBe("function");
    const dispatcher = new MockAgent();
    dispatcher.disableNetConnect();
    try {
      const pool = dispatcher.get("https://local-test.invalid");
      pool.intercept({ path: "/draft", method: "POST", body: "draft" }).reply(200, "ok", {
        headers: { "x-contract": "preserved" },
      });
      const response = await request("https://local-test.invalid/draft", {
        dispatcher, method: "POST", body: "draft", headers: { "content-type": "text/plain" },
      });
      expect(response.statusCode).toBe(200);
      expect(new Headers(response.headers).get("x-contract")).toBe("preserved");
      expect(await response.body.text()).toBe("ok");
      pool.intercept({ path: "/status", method: "GET" }).reply(200, '{"ok":true}');
      const fetched = await fetch("https://local-test.invalid/status", { dispatcher });
      expect(await fetched.json()).toEqual({ ok: true });
      dispatcher.assertNoPendingInterceptors();
    } finally {
      await dispatcher.close();
    }
  });

  it("retains both route parser APIs without upgrading v6 consumers to v8", () => {
    const v6 = fromConsumer("@vercel/node")("path-to-regexp");
    const keys: unknown[] = [];
    expect(v6.pathToRegexp("/items/:id", keys).test("/items/42")).toBe(true);
    expect(keys).toHaveLength(1);
    const v8 = fromConsumer("@vercel/fun")("path-to-regexp");
    expect(v8.match("/items/:id")("/items/42").params.id).toBe("42");
    expect(v8.match("/items/:id")("/other/42")).toBe(false);
  });

  it("preserves schema validation including rejection of invalid config", () => {
    const Ajv = fromConsumer("@vercel/static-config")("ajv");
    const validate = new Ajv().compile({ type: "object", required: ["name"], properties: { name: { type: "string" } } });
    expect(validate({ name: "Home" })).toBe(true);
    expect(validate({ name: 42 })).toBe(false);
  });

  it("preserves Python metadata parsers and file matching", () => {
    const load = fromConsumer("@vercel/python-analysis");
    expect(load("js-yaml").load("name: Home\nenabled: true")).toEqual({ name: "Home", enabled: true });
    expect(load("smol-toml").parse('[project]\nname = "Home"')).toEqual({ project: { name: "Home" } });
    expect(load("minimatch").minimatch("src/main.py", "**/*.py")).toBe(true);
    expect(load("minimatch").minimatch("src/main.ts", "**/*.py")).toBe(false);
  });
});
