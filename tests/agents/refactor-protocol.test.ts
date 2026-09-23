import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import fixture from "../fixtures/refactor-protocol.json";
import { recordRun, writeMemoryReconciliation, buildContextPack } from "../../automation/agents/memory.mjs";
import type { MemoryReconciliation } from "../../automation/agents/reconcile.mjs";
import { validateAuthorizationBundle } from "../../automation/agents/authorizations.mjs";
import type { RunReport } from "../../automation/agents/contracts.mjs";
import type { AgentPolicy } from "../../automation/agents/policy.mjs";

const policy = fixture.policy as unknown as AgentPolicy;
const roots: string[] = [];
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const resultHash = (value: unknown) => hash(JSON.stringify(value));

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fileHashes(root: string) {
  const paths = ["state.json", ...["runs", "reconciliations"].flatMap((dir) =>
    readdirSync(join(root, dir)).sort().map((name) => `${dir}/${name}`),
  )];
  return Object.fromEntries(paths.map((path) => [path, hash(readFileSync(join(root, path)))]));
}

describe("frozen pre-refactor protocol parity", () => {
  it("preserves run/reconciliation bytes, errors, duplicate results and context ranking", () => {
    const root = mkdtempSync(join(tmpdir(), "obraxen-refactor-protocol-"));
    roots.push(root);
    fixture.reports.forEach((report, index) => {
      const result = recordRun(report as unknown as RunReport, {
        root, policy, now: new Date(fixture.times[index]),
      });
      expect(resultHash(result)).toBe(fixture.snapshots[index].resultHash);
      expect(fileHashes(root)).toEqual(fixture.snapshots[index].files);
    });
    expect(resultHash(recordRun(fixture.reports[2] as unknown as RunReport, {
      root, policy, now: new Date(fixture.times[2]),
    }))).toBe(fixture.duplicateHash);

    fixture.badReports.forEach((report, index) => {
      expect(() => recordRun(report as unknown as RunReport, {
        root, policy, now: new Date(fixture.times[2]),
      })).toThrow(fixture.reportErrors[index]);
    });
    fixture.badReconciliations.forEach((reconciliation, index) => {
      expect(() => writeMemoryReconciliation(reconciliation as unknown as MemoryReconciliation, {
        root, policy, now: new Date(fixture.times[2]),
      })).toThrow(fixture.reconciliationErrors[index]);
    });
    // Replay the raw JSON boundary accepted by the original memory validator.
    const result = writeMemoryReconciliation(fixture.reconciliation as unknown as MemoryReconciliation, {
      root, policy, now: new Date("2026-09-01T13:01:00Z"),
    });
    expect(resultHash(result)).toBe(fixture.reconciliationSnapshot.resultHash);
    expect(fileHashes(root)).toEqual(fixture.reconciliationSnapshot.files);

    for (const entry of fixture.contexts) {
      const contextPolicy = structuredClone(policy);
      contextPolicy.memory.maxContextBytes = entry.budget;
      const build = () => buildContextPack({
        root, policy: contextPolicy, baseSha: "b".repeat(40), query: entry.query,
        now: new Date("2026-09-01T14:00:00Z"),
      });
      if (entry.error) expect(build).toThrow(entry.error);
      else {
        const pack = build();
        expect(resultHash(pack)).toBe(entry.hash);
        expect(pack.truncated).toBe(entry.truncated);
      }
    }
  });

  it("preserves authorization bundle ordering and validation errors", () => {
    expect(resultHash(validateAuthorizationBundle(fixture.bundle, policy))).toBe(fixture.bundleHash);
    fixture.badBundles.forEach((bundle, index) => {
      expect(() => validateAuthorizationBundle(bundle, policy)).toThrow(fixture.bundleErrors[index]);
    });
  });
});
