import { describe, expect, it } from "vitest";
import { getLighthouseBudgets } from "../scripts/lighthouse-budgets";

describe("Lighthouse publication budgets", () => {
  it("accepts the deliberate noindex SEO score only in preview", () => {
    expect(getLighthouseBudgets({ isPublic: false, isCi: false }).seo).toBe(0.65);
    expect(getLighthouseBudgets({ isPublic: true, isCi: false }).seo).toBe(0.95);
  });

  it("keeps the runner-only LCP margin separate from the local budget", () => {
    expect(getLighthouseBudgets({ isPublic: false, isCi: false }).lcp).toBe(3_000);
    expect(getLighthouseBudgets({ isPublic: false, isCi: true }).lcp).toBe(3_250);
  });
});
