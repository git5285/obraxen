import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publicProjects, publicProjectsBySlug } from "@/lib/projects";
import { publicDataLeaks } from "./helpers/public-module-boundary";

const publicModules = ["src/proxy.ts", ...readdirSync("src/app", { recursive: true })
  .filter((path): path is string => typeof path === "string" && /\.[jt]sx?$/.test(path))
  .map((path) => `src/app/${path}`)];

describe("public project artifact boundary", () => {
  it("keeps the internal project dataset out of modules used by public routes", () => {
    expect(publicDataLeaks(publicModules, process.cwd())).toEqual([]);
  });

  it("keeps the public registry explicit while no case has approved assets", () => {
    expect(publicProjects).toEqual([]);
    expect(publicProjectsBySlug.size).toBe(0);
  });

  it.each([
    'export { data } from "../lib/bridge";',
    'const data = import("../lib/bridge");',
    'const data = require("../lib/bridge");',
  ])("detects indirect private data through %s", (entry) => {
    const root = resolve("/virtual-boundary");
    const files: Record<string, string> = {
      [resolve(root, "src/app/page.ts")]: entry,
      [resolve(root, "src/lib/bridge.ts")]: 'export { default as data } from "../../data/proyectos.json";',
      [resolve(root, "data/proyectos.json")]: "[]",
    };
    const leaks = publicDataLeaks(["src/app/page.ts"], root, {
      exists: (path) => Object.hasOwn(files, path), read: (path) => files[path],
    });
    expect(leaks).toEqual([[
      resolve(root, "src/app/page.ts"), resolve(root, "src/lib/bridge.ts"), resolve(root, "data/proyectos.json"),
    ]]);
  });
});
