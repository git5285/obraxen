import { afterEach, describe, expect, it, vi } from "vitest";
import LocaleLayout, { dynamic as layoutMode } from "@/app/[lang]/layout";
import { GET, dynamic as endpointMode } from "@/app/api/analytics-config/route";

afterEach(() => vi.unstubAllEnvs());

describe("analytics configuration timing contract", () => {
  it("retains distinct layout and endpoint rendering policies", () => {
    expect(layoutMode).toBe("force-dynamic");
    expect(endpointMode).toBe("force-static");
  });

  it.each([undefined, "G-TEST123456"])("reads layout availability from runtime environment: %s", async (id) => {
    vi.stubEnv("GA_MEASUREMENT_ID", id);
    vi.stubEnv("CLARITY_PROJECT_ID", undefined);
    const layout = await LocaleLayout({ children: null, params: Promise.resolve({ lang: "en" }) });
    expect(layout.props.children.props.children[1].props.analyticsAvailable).toBe(Boolean(id));
  });

  it("serializes only public IDs with private no-store headers", async () => {
    vi.stubEnv("GA_MEASUREMENT_ID", "g-test123456");
    vi.stubEnv("CLARITY_PROJECT_ID", "TESTCLARITY1");
    const response = GET();
    expect(await response.json()).toEqual({ gaMeasurementId: "G-TEST123456", clarityProjectId: "testclarity1" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
