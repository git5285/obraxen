import approvalSource from "../../data/public-activation.json";

export type PublicActivationApproval = {
  schemaVersion: 1;
  approved: boolean;
  activationDigest: string | null;
  approvedAt: string | null;
  decisionId: string | null;
};

const identifier = /^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/;
const digest = /^[0-9a-f]{64}$/;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export function validatePublicActivation(value: unknown): PublicActivationApproval {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("public activation must be an object");
  const record = value as Record<string, unknown>;
  const keys = ["activationDigest", "approved", "approvedAt", "decisionId", "schemaVersion"];
  if (Object.keys(record).some((key) => !keys.includes(key)) || keys.some((key) => !Object.hasOwn(record, key))) {
    throw new Error("public activation keys must be exact");
  }
  if (record.schemaVersion !== 1 || typeof record.approved !== "boolean") throw new Error("public activation is invalid");
  if (!record.approved) {
    if (record.activationDigest !== null || record.approvedAt !== null || record.decisionId !== null) {
      throw new Error("unapproved public activation must not carry approval evidence");
    }
    return { schemaVersion: 1, approved: false, activationDigest: null, approvedAt: null, decisionId: null };
  }
  if (typeof record.activationDigest !== "string" || !digest.test(record.activationDigest)
    || typeof record.decisionId !== "string" || !identifier.test(record.decisionId)
    || typeof record.approvedAt !== "string" || !timestamp.test(record.approvedAt) || Number.isNaN(Date.parse(record.approvedAt))) {
    throw new Error("approved public activation requires typed evidence");
  }
  return record as PublicActivationApproval;
}

export const publicActivation = validatePublicActivation(approvalSource);
