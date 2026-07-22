import { loadPolicy } from "./policy.mjs";

export const ATTENTION_CLASSES = Object.freeze([
  "product",
  "reliability",
  "agent_maintenance",
]);

function pathMatches(pattern, path) {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  if (pattern.endsWith("*")) return path.startsWith(pattern.slice(0, -1));
  return path === pattern;
}

export function classifyFindingAttention(finding, policy = loadPolicy()) {
  if (!finding || typeof finding !== "object" || Array.isArray(finding)) {
    throw new Error("finding must be an object");
  }
  if (!Array.isArray(finding.candidatePaths) || finding.candidatePaths.length === 0) {
    throw new Error("finding.candidatePaths must be a non-empty array");
  }
  if (
    finding.candidatePaths.some((path) => (
      policy.attentionBudget.agentPathPatterns.some((pattern) => pathMatches(pattern, path))
    ))
  ) return "agent_maintenance";
  if (policy.attentionBudget.productDomains.includes(finding.domain)) return "product";
  if (policy.attentionBudget.reliabilityDomains.includes(finding.domain)) return "reliability";
  throw new Error(`finding domain ${finding.domain ?? "<missing>"} has no attention class`);
}

export function countAttentionSequence(policy = loadPolicy()) {
  return Object.fromEntries(ATTENTION_CLASSES.map((attentionClass) => [
    attentionClass,
    policy.attentionBudget.sequence.filter((item) => item === attentionClass).length,
  ]));
}

export function expectedScheduledAttentionClass(scheduledCycles, policy = loadPolicy()) {
  if (!Number.isInteger(scheduledCycles) || scheduledCycles < 0) {
    throw new Error("scheduledCycles must be a non-negative integer");
  }
  return policy.attentionBudget.sequence[
    scheduledCycles % policy.attentionBudget.sequence.length
  ];
}

export function buildAttentionBudgetSnapshot(attention, policy = loadPolicy()) {
  const targetCounts = countAttentionSequence(policy);
  return {
    schemaVersion: 1,
    sequence: [...policy.attentionBudget.sequence],
    windowSize: policy.attentionBudget.sequence.length,
    targetCounts,
    targetPercentages: Object.fromEntries(ATTENTION_CLASSES.map((attentionClass) => [
      attentionClass,
      targetCounts[attentionClass] * 10,
    ])),
    scheduledCycles: attention.scheduledCycles,
    completedWindows: Math.floor(
      attention.scheduledCycles / policy.attentionBudget.sequence.length,
    ),
    cursor: attention.scheduledCycles % policy.attentionBudget.sequence.length,
    nextScheduledClass: expectedScheduledAttentionClass(attention.scheduledCycles, policy),
    scheduledByClass: { ...attention.scheduledByClass },
    operationalByClass: { ...attention.operationalByClass },
    recentScheduled: [...attention.recentScheduled],
  };
}
