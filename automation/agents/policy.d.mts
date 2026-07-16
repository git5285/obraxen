export interface AgentPolicy {
  schemaVersion: 1;
  mode: "shadow" | "active" | "disabled";
  project: "remainon";
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
