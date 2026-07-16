export interface ToolUseInput {
  agent_type?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}

export interface HookDenial {
  hookSpecificOutput: {
    hookEventName: "PreToolUse";
    permissionDecision: "deny";
    permissionDecisionReason: string;
  };
}

export function evaluateToolUse(input: ToolUseInput, policy?: AgentPolicy): HookDenial | null;
import type { AgentPolicy } from "../../automation/agents/policy.mjs";
