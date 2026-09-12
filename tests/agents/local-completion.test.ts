import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { readOperationalClaims, registerOperationalClaim, transitionOperationalClaim } from "../../automation/agents/operations.mjs";

it("releases completed local work using a real handoff digest without rewriting the marker", () => {
  const root = mkdtempSync(join(tmpdir(), "obraxen-local-completion-"));
  try {
    const repo = join(root, "repository");
    const stateHome = join(root, "state");
    mkdirSync(join(repo, ".coordination/claims"), { recursive: true });
    mkdirSync(join(repo, ".coordination/handoffs"), { recursive: true });
    execFileSync("git", ["init", "-q", repo]);
    execFileSync("git", ["-C", repo, "remote", "add", "origin", "https://example.invalid/local-completion.git"]);
    const threadId = "local-completion-fixture";
    const claimPath = `.coordination/claims/${threadId}.md`;
    const marker = `# Local completion\n- thread_id: ${threadId}\n- estado: reservado\n- archivos:\n  - fixture.txt\n`;
    writeFileSync(join(repo, claimPath), marker);
    writeFileSync(join(repo, "fixture.txt"), "completed work\n");
    const common = { repo, stateHome, threadId };
    registerOperationalClaim({ ...common, claimPath, eventId: "local-register", occurredAt: "2026-09-12T06:00:00Z" });
    transitionOperationalClaim({ ...common, eventId: "local-start", occurredAt: "2026-09-12T06:00:01Z", state: "en_curso", reason: "work_started" });
    transitionOperationalClaim({ ...common, eventId: "local-review", occurredAt: "2026-09-12T06:00:02Z", state: "esperando_revision", reason: "candidate_ready" });
    expect(() => transitionOperationalClaim({ ...common, eventId: "local-missing", occurredAt: "2026-09-12T06:00:03Z", state: "liberado", reason: "local_completed" })).toThrow();
    const path = `.coordination/handoffs/${threadId}.md`;
    const handoff = "# Completed local fixture\n- verificaciones: fixture content asserted\n- pendiente: ninguno\n";
    writeFileSync(join(repo, path), handoff);
    expect(readFileSync(join(repo, "fixture.txt"), "utf8")).toBe("completed work\n");
    transitionOperationalClaim({ ...common, eventId: "local-release", occurredAt: "2026-09-12T06:00:04Z", state: "liberado", reason: "local_completed", evidence: [{ kind: "handoff", path, contentDigest: createHash("sha256").update(readFileSync(join(repo, path))).digest("hex") }] });
    expect(readOperationalClaims(repo, stateHome)[0]).toMatchObject({ state: "liberado", eventCount: 4 });
    expect(readFileSync(join(repo, claimPath), "utf8")).toBe(marker);
    expect(readFileSync(join(repo, "fixture.txt"), "utf8")).toBe("completed work\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
