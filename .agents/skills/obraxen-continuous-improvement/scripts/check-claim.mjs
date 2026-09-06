import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalClaimState, isClaimPath, parseClaim } from "../../../../automation/agents/claims.mjs";

export function checkClaim(text, source, expected) {
  assert(/^\.coordination\/claims\/[A-Za-z0-9][A-Za-z0-9._-]{2,180}\.md$/.test(source), "Invalid claim source");
  assert(expected && typeof expected.threadId === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{2,180}$/.test(expected.threadId), "Expected threadId required");
  assert(Array.isArray(expected.files) && expected.files.length > 0, "Expected exact files required");
  for (const path of expected.files) {
    assert(typeof path === "string" && isClaimPath(path) && !/[*?\[\]{}!]/.test(path), "Expected paths must be exact repository files");
  }
  assert.equal(new Set(expected.files).size, expected.files.length, "Duplicate expected files");
  const claim = parseClaim(text, source, process.cwd());
  assert.equal(claim.metadataErrors.length, 0, claim.metadataErrors.join("; "));
  assert.equal(claim.invalidFileEntries.length, 0, "Invalid file entries");
  assert.equal(claim.threadId, expected.threadId, "Unexpected thread_id");
  assert.equal(canonicalClaimState(claim.state), "reservado", "New claim must start reservado; never rewrite a registered marker");
  assert.equal(new Set(claim.files).size, claim.files.length, "Duplicate claim files");
  assert.deepEqual([...claim.files].sort(), [...expected.files].sort(), "Parsed scope differs from intended exact files; use the repository claim template");
  return { valid: true, threadId: claim.threadId, files: claim.files, contentDigest: claim.contentDigest,
    scope: "Syntax and intended scope only; not registration, ownership or write authority" };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [source, expectedPath, ...extra] = process.argv.slice(2);
    assert(source && expectedPath && extra.length === 0, "Usage: check-claim.mjs .coordination/claims/<id>.md <expected-scope.json>");
    const expected = JSON.parse(readFileSync(resolve(expectedPath), "utf8"));
    console.log(JSON.stringify(checkClaim(readFileSync(resolve(source), "utf8"), source, expected), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
