export interface LocalTaskSpec {threadId: string; objective: string; nextStep: string; files: string[]}
export interface LocalTaskResult {threadId: string; result: string; changedPaths: string[];
  checks: {command: string; status: string; evidence: string}[]; decisions: string[]; pending: string[]}
export interface LocalTaskContext {root: string; controlRoot: string; head: string; branch: string | null;
  task: {id: string; owner: string | null; state: string; checkout: string | null; nextStep: string; paths: string[]};
  changeCount: number; status: string[]; statusTruncated: boolean}
export function startLocalTask(spec: LocalTaskSpec, options?: {repo?: string; stateHome?: string}): LocalTaskContext;
export function finishLocalTask(report: LocalTaskResult, options?: {repo?: string; stateHome?: string}): LocalTaskContext;
