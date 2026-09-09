export type Role = "scout" | "builder" | "auditor";
export function isolatedRoleEnvironment(role: Role, inherited?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export type Profile = { path: string; digest: string; model: string; effort: string; instructions: string; sandbox: string };
export type Evidence = { permissionsMatch: boolean; hookTrusted: boolean; readyForWork: false; blockers: string[]; modelTurnsStarted: number; toolCallsRequested: number; [key: string]: unknown };
export function readRoleProfile(cwd: string, role: Role): Profile;
export function assessHost(input: { cwd: string; role: Role; profile: Profile; started: unknown; hooks: unknown }): Evidence;
export function inspectSession(rpc: (method: string, params: unknown) => Promise<unknown>, input: { cwd: string; role: Role; profile: Profile }): Promise<Evidence>;
export function inspectRoleHost(input: { cwd: string; role: Role; codex?: string; timeoutMs?: number }): Promise<Evidence>;
