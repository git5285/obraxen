export interface AgentPolicy {
  schemaVersion: 1;
  mode: "shadow" | "active" | "disabled";
  project: "obraxen";
  coordination: {
    stateHome: string;
  };
  limits: {
    maxConcurrentWriters: number;
    maxPendingLocalDiffs: number;
    maxActiveSystemPullRequests: number;
    maxFindingsPerRun: number;
    maxChangedFiles: number;
    maxDiffLines: number;
    maxCorrectionIterations: number;
    maxRunSeconds: number;
    leaseTtlSeconds: number;
  };
  memory: {
    schemaVersion: 1;
    maxEpisodicRuns: number;
    maxOpenFindings: number;
    maxProposedRules: number;
    contextRecentRuns: number;
    contextOpenFindings: number;
    maxContextBytes: number;
  };
  attentionBudget: {
    schemaVersion: 1;
    sequence: Array<"product" | "reliability" | "agent_maintenance">;
    productDomains: string[];
    reliabilityDomains: string[];
    agentPathPatterns: string[];
  };
  reconciliation: {
    defaultBranch: string;
    requiredPullRequestChecks: string[];
  };
  groupedAuthorizations: {
    enabled: boolean;
    maxSteps: number;
    maxLifetimeSeconds: number;
    reservationTtlSeconds: number;
    allowedActions: Array<
      "commit_candidate" | "push_branch" | "create_draft_pull_request"
    >;
  };
  authority: {
    allowScout: boolean;
    allowMemoryPersistence: boolean;
    allowLocalDiff: boolean;
    allowCommit: boolean;
    allowPush: boolean;
    allowDraftPullRequest: boolean;
    allowMerge: boolean;
    allowDeploy: boolean;
    allowPublish: boolean;
    allowNetwork: boolean;
    allowDependencyChanges: boolean;
  };
  protectedPaths: string[];
  activationInvariant: {
    schemaVersion: number;
    candidateAuditRequired: boolean;
    publicationAuthorized: boolean;
    publishSwitch: boolean;
    requireExactBeforeAfterMatch: boolean;
  };
  requiredChecks: string[];
}

export const defaultPolicyUrl: URL;
export function validatePolicy(policy: AgentPolicy): AgentPolicy;
export function loadPolicy(url?: URL): AgentPolicy;
