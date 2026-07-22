import { describe, expect, it } from "vitest";
import {
  buildAttentionBudgetSnapshot,
  classifyFindingAttention,
  countAttentionSequence,
  expectedScheduledAttentionClass,
} from "../../automation/agents/attention.mjs";
import { loadPolicy } from "../../automation/agents/policy.mjs";

describe("agent attention budget", () => {
  it("enforces seven product, two reliability and one agent-maintenance slots", () => {
    const policy = loadPolicy();
    expect(countAttentionSequence(policy)).toEqual({
      product: 7,
      reliability: 2,
      agent_maintenance: 1,
    });
    expect(Array.from({ length: 10 }, (_, index) => (
      expectedScheduledAttentionClass(index, policy)
    ))).toEqual(policy.attentionBudget.sequence);
    expect(expectedScheduledAttentionClass(10, policy)).toBe("product");
  });

  it("classifies product and reliability domains while agent paths take precedence", () => {
    expect(classifyFindingAttention({
      domain: "accessibility",
      candidatePaths: ["src/components/header.tsx"],
    })).toBe("product");
    expect(classifyFindingAttention({
      domain: "testing",
      candidatePaths: ["tests/homepage.test.ts"],
    })).toBe("reliability");
    expect(classifyFindingAttention({
      domain: "maintainability",
      candidatePaths: ["automation/agents/memory.mjs"],
    })).toBe("agent_maintenance");
  });

  it("exposes the next deterministic slot and measured totals", () => {
    const snapshot = buildAttentionBudgetSnapshot({
      scheduledCycles: 6,
      scheduledByClass: { product: 4, reliability: 1, agent_maintenance: 1 },
      operationalByClass: { product: 5, reliability: 2, agent_maintenance: 3, unknown: 18 },
      recentScheduled: [],
    });
    expect(snapshot).toMatchObject({
      targetPercentages: { product: 70, reliability: 20, agent_maintenance: 10 },
      cursor: 6,
      nextScheduledClass: "product",
      scheduledCycles: 6,
    });
  });
});
