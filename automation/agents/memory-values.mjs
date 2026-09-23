import { createHash } from "node:crypto";

// Persistent memory hashes intentionally preserve JSON insertion order.
// Do not substitute the canonical authorization digest without a migration.
export function stableDigest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function normalized(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}
