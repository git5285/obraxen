import { describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runIntegrationSuite, summarizeObservations } from "../../.agents/skills/obraxen-continuous-improvement/scripts/evaluate.mjs";

vi.mock("node:fs", async (importOriginal) => {
  const fs = await importOriginal<typeof import("node:fs")>();
  return { ...fs, mkdtempSync: vi.fn(fs.mkdtempSync), writeFileSync: vi.fn(fs.writeFileSync) };
});

const observation = (overrides = {}) => ({
  id: "fixture", durationMs: 25, status: "passed", usefulChangeVerified: false,
  outcome: "no_op", checks: [], ...overrides,
});
const passedCheck = { id: "behavior", inputDigest: "a".repeat(64), status: "passed" };

describe("skill evaluation measurements", () => {
  it("keeps no-op and expected blocks successful without claiming useful changes", () => {
    const result = summarizeObservations([
      observation(),
      observation({ id: "protected", outcome: "expected_block" }),
      observation({ id: "changed", outcome: "local_fixture_change", usefulChangeVerified: true, checks: [passedCheck] }),
      observation({ id: "failed-change", status: "failed", outcome: "failure", usefulChangeVerified: null }),
    ]);
    expect(result).toMatchObject({ cases: 4, passed: 3, failed: 1, verifiedUsefulChanges: 1,
      expectedBlocks: 1, totalCaseDurationMs: 100, inputTokens: null, outputTokens: null, costUsd: null });
  });

  it("counts repeated passed checks only on the same input, not retries or changed inputs", () => {
    const check = { id: "quality", inputDigest: "a".repeat(64), status: "passed" };
    const result = summarizeObservations([observation({ checks: [
      { ...check, status: "failed" }, check, check,
      { ...check, inputDigest: "b".repeat(64) }, { ...check, id: "activation" },
    ] })]);
    expect(result.repeatedPassedChecks).toBe(1);
  });

  it("rejects missing or invalid evidence instead of fabricating measurements", () => {
    expect(() => summarizeObservations([observation(), observation()])).toThrow("Duplicate");
    expect(() => summarizeObservations([observation({ durationMs: null })])).toThrow("duration");
    expect(() => summarizeObservations([observation({ durationMs: -1 })])).toThrow("duration");
    expect(() => summarizeObservations([observation({ usefulChangeVerified: "yes" })])).toThrow("evidence");
    expect(() => summarizeObservations([observation({ checks: [{ id: "test", status: "passed" }] })])).toThrow("digest");
  });

  it("separates a demonstrated avoidable block from an unclassified failure", () => {
    const result = summarizeObservations([
      observation({ id: "avoidable", status: "failed", outcome: "avoidable_block" }),
      observation({ id: "unknown", status: "failed", outcome: "failure" }),
    ]);
    expect(result).toMatchObject({ failed: 2, avoidableBlocks: 1, unclassifiedFailures: 1, expectedBlocks: 0 });
  });

  it("rejects contradictory useful-change claims", () => {
    for (const outcome of ["no_op", "expected_block", "failure", "avoidable_block"]) {
      expect(() => summarizeObservations([observation({ outcome, usefulChangeVerified: true, checks: [passedCheck] })])).toThrow("requires");
    }
    for (const checks of [[], [{ ...passedCheck, status: "failed" }]]) {
      expect(() => summarizeObservations([observation({ outcome: "local_fixture_change", usefulChangeVerified: true, checks })])).toThrow("requires");
    }
    expect(() => summarizeObservations([observation({ outcome: "local_fixture_change", status: "failed", usefulChangeVerified: true, checks: [passedCheck] })])).toThrow("requires");
  });

  it.each(["failure", "avoidable_block"])("rejects a passed %s outcome", (outcome) => {
    expect(() => summarizeObservations([observation({ outcome })])).toThrow();
  });

  it.each(["no_op", "expected_block", "local_fixture_change"])("rejects a failed %s outcome", (outcome) => {
    expect(() => summarizeObservations([observation({ outcome, status: "failed" })])).toThrow();
  });

  it("rejects a passed observation with an unresolved failed check", () => {
    expect(() => summarizeObservations([observation({ checks: [
      { ...passedCheck, status: "failed" },
      { ...passedCheck, id: "unrelated" },
    ] })])).toThrow();
  });

  it("does not classify recovery from a failure as redundant verification", () => {
    const result = summarizeObservations([observation({ checks: [
      passedCheck, { ...passedCheck, status: "failed" }, passedCheck,
    ] })]);
    expect(result).toMatchObject({ passed: 1, failed: 0, repeatedPassedChecks: 0 });
  });

  it("requires all distinct check inputs to finish successfully", () => {
    expect(() => summarizeObservations([observation({ checks: [
      { ...passedCheck, status: "failed" },
      { ...passedCheck, inputDigest: "b".repeat(64) },
    ] })])).toThrow();
  });

  it("accepts verified recovery while retaining the failed attempt in the evidence", () => {
    const checks = [{ ...passedCheck, status: "failed" }, passedCheck];
    const before = structuredClone(checks);
    const result = summarizeObservations([observation({
      outcome: "local_fixture_change", usefulChangeVerified: true, checks,
    })]);
    expect(result).toMatchObject({ verifiedUsefulChanges: 1, repeatedPassedChecks: 0 });
    expect(checks).toEqual(before);
  });
});

describe("skill deterministic integration in the normal test gate", () => {
  it("cleans its isolated root when report persistence fails before returning", async () => {
    const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
    vi.mocked(mkdtempSync).mockClear();
    vi.mocked(writeFileSync).mockImplementation((path, data, options) => {
      if (String(path).endsWith("/report.json")) throw new Error("injected_report_write_failure");
      return fs.writeFileSync(path, data, options);
    });
    try {
      expect(() => runIntegrationSuite()).toThrow("injected_report_write_failure");
      const root = vi.mocked(mkdtempSync).mock.results[0]?.value;
      expect(typeof root).toBe("string");
      expect(existsSync(root)).toBe(false);
    } finally {
      vi.mocked(writeFileSync).mockImplementation(fs.writeFileSync);
      for (const result of vi.mocked(mkdtempSync).mock.results) {
        if (result.type === "return") rmSync(result.value, { recursive: true, force: true });
      }
    }
  }, 30_000);

  it("executes and persists every isolated lifecycle and safety case", () => {
    const report = runIntegrationSuite();
    try {
      expect(report.summary).toMatchObject({ cases: 7, passed: 7, failed: 0,
        verifiedUsefulChanges: 1, expectedBlocks: 5, avoidableBlocks: 0 });
      expect(report.observations.map((row) => row.id).sort()).toEqual([
        "complete-local-lifecycle", "conflicting-report-block", "immutable-claim-block",
        "no-op-persistence", "protected-maintenance-block",
        "scheduled-maintenance-active", "scheduled-maintenance-shadow",
      ].sort());
      expect(report.observations.every((row) => row.checks.length > 0
        && row.checks.every((check) => check.status === "passed"))).toBe(true);
      expect(JSON.parse(readFileSync(join(report.root, "report.json"), "utf8"))).toEqual(report);
    } finally {
      rmSync(report.root, { recursive: true, force: true });
    }
  }, 30_000);
});
