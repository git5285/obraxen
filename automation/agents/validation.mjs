import { createHash } from "node:crypto";

export function nonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

export function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

export function exactKeys(value, label, allowed) {
  const present = Object.keys(value);
  const unexpected = present.filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !Object.hasOwn(value, key));
  if (unexpected.length > 0) throw new Error(`${label} has unexpected keys: ${unexpected.join(", ")}`);
  if (missing.length > 0) throw new Error(`${label} is missing keys: ${missing.join(", ")}`);
}

export function safeIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(value)) {
    throw new Error(`${label} contains unsafe characters`);
  }
  return value;
}

export function timestamp(value, label) {
  if (
    typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
    || Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${label} must be a UTC ISO timestamp`);
  }
  return value;
}

export function sha(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/.test(value)) {
    throw new Error(`${label} must be a 40 character git SHA`);
  }
  return value;
}

export function sha256(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a SHA-256 digest`);
  }
  return value;
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]),
    );
  }
  return value;
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonicalJson(value))).digest("hex");
}
