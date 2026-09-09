import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/[lang]/architecture-preview/media/[project]/[stage]/route";
import { internalProjects } from "@/lib/internal-projects";

afterEach(() => vi.unstubAllEnvs());
const allowed = () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", "local-only");
  vi.stubEnv("VERCEL", "");
};
const request = (lang = "es", project = "delticom-hannover", stage = "result", hostname = "127.0.0.1") => GET(
  new Request(`http://${hostname}:3011/${lang}/architecture-preview/media/${project}/${stage}/`),
  { params: Promise.resolve({ lang, project, stage }) },
);
describe("private architecture media", () => {
  it.each([
    ["production", "local-only", ""], ["development", "", ""], ["development", "local-only", "1"],
  ])("does not expose images under %s/%s/%s", async (mode, flag, vercel) => {
    vi.stubEnv("NODE_ENV", mode);vi.stubEnv("OBRAXEN_ARCHITECTURE_PREVIEW", flag);vi.stubEnv("VERCEL", vercel);
    const response = await request();
    expect(response.status).toBe(404);expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it.each([
    ["en", "delticom-hannover", "result", "localhost"],
    ["es", "unknown", "result", "localhost"],
    ["es", "delticom-hannover", "unknown", "localhost"],
    ["es", "..", "result", "localhost"],
    ["es", "delticom-hannover", "result", "example.invalid"],
  ])("rejects non-allowlisted requests %s/%s/%s on %s", async (lang, project, stage, host) => {
    allowed();expect((await request(lang, project, stage, host)).status).toBe(404);
  });
  it.each(["delticom-hannover", "hologram-paris"])("serves unchanged private image bytes for %s", async slug => {
    allowed();
    for (const stage of ["initial", "result"]) {
      const response = await request("es", slug, stage);
      const image = internalProjects.find(p => p.slug === slug)!.imagenes.find(i => i.etapa === (stage === "initial" ? "Estado inicial" : "Resultado documentado"))!;
      expect(response.status).toBe(200);
      expect(Buffer.from(await response.arrayBuffer())).toEqual(await readFile(resolve(image.src)));
      expect(response.headers.get("content-type")).toBe("image/webp");
      expect(response.headers.get("cache-control")).toBe("private, no-store, no-transform");
      expect(response.headers.get("cross-origin-resource-policy")).toBe("same-origin");
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
    }
  });
});
